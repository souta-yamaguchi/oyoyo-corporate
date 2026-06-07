"""Bluesky と YouTube から "oyoyo"/"オヨヨ" 言及を収集して data/oyoyo-feed.json に保存する。"""
import os
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

OUTPUT = Path('data/oyoyo-feed.json')
MAX_ITEMS = 30
KEYWORDS = ['oyoyo', 'オヨヨ', 'ｵﾖﾖ']

# ASCII 用は単語境界つき (yoyoyo などの部分一致を弾く)
WORD_RE = re.compile(r'\boyoyo\b', re.IGNORECASE)

BLUESKY_HANDLE = os.environ.get('BLUESKY_HANDLE', '').strip()
BLUESKY_APP_PASSWORD = os.environ.get('BLUESKY_APP_PASSWORD', '').strip()
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '').strip()


def matches_keyword(text: str) -> bool:
    if not text:
        return False
    if WORD_RE.search(text):
        return True
    if 'オヨヨ' in text or 'ｵﾖﾖ' in text:
        return True
    return False


# ---------- Bluesky ----------

def bluesky_session() -> str | None:
    if not BLUESKY_HANDLE or not BLUESKY_APP_PASSWORD:
        print('[bluesky] credentials missing', file=sys.stderr)
        return None
    # ハンドルが xxx.bsky.social 形式でなければ補完を試す
    candidates = [BLUESKY_HANDLE]
    if '.' not in BLUESKY_HANDLE.replace('.bsky.social', ''):
        candidates.append(f'{BLUESKY_HANDLE}.bsky.social')
    elif not BLUESKY_HANDLE.endswith('.bsky.social') and BLUESKY_HANDLE.count('.') == 1:
        candidates.append(f'{BLUESKY_HANDLE}.bsky.social')
    for handle in candidates:
        try:
            res = requests.post(
                'https://bsky.social/xrpc/com.atproto.server.createSession',
                json={'identifier': handle, 'password': BLUESKY_APP_PASSWORD},
                timeout=20,
            )
            if res.ok:
                print(f'[bluesky] logged in as {handle}', file=sys.stderr)
                return res.json().get('accessJwt')
            print(f'[bluesky] login failed for {handle}: {res.status_code} {res.text[:200]}', file=sys.stderr)
        except Exception as e:
            print(f'[bluesky] error for {handle}: {e}', file=sys.stderr)
    return None


def bluesky_search(token: str, keyword: str, limit: int = 25) -> list[dict]:
    try:
        res = requests.get(
            'https://bsky.social/xrpc/app.bsky.feed.searchPosts',
            params={'q': keyword, 'limit': limit, 'sort': 'latest'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=20,
        )
        if not res.ok:
            print(f'[bluesky] search failed for {keyword}: {res.status_code}', file=sys.stderr)
            return []
        return res.json().get('posts', [])
    except Exception as e:
        print(f'[bluesky] search error for {keyword}: {e}', file=sys.stderr)
        return []


def collect_bluesky() -> list[dict]:
    token = bluesky_session()
    if not token:
        return []
    items: list[dict] = []
    seen: set[str] = set()
    for kw in KEYWORDS:
        for post in bluesky_search(token, kw):
            uri = post.get('uri', '')
            if uri in seen:
                continue
            seen.add(uri)
            text = (post.get('record') or {}).get('text', '')
            if not matches_keyword(text):
                continue
            author = post.get('author') or {}
            handle = author.get('handle', '')
            rkey = uri.split('/')[-1] if uri else ''
            url = f'https://bsky.app/profile/{handle}/post/{rkey}' if handle and rkey else ''
            langs = (post.get('record') or {}).get('langs') or []
            items.append({
                'source': 'bluesky',
                'text': text,
                'author': f'@{handle}' if handle else '',
                'url': url,
                'posted_at': post.get('indexedAt', ''),
                'lang': langs[0] if langs else '',
            })
    print(f'[bluesky] collected {len(items)} items', file=sys.stderr)
    return items


# ---------- YouTube ----------

def youtube_search_videos(keyword: str, max_results: int = 5) -> list[dict]:
    try:
        res = requests.get(
            'https://www.googleapis.com/youtube/v3/search',
            params={
                'part': 'snippet',
                'q': keyword,
                'type': 'video',
                'order': 'date',
                'maxResults': max_results,
                'key': YOUTUBE_API_KEY,
            },
            timeout=20,
        )
        if not res.ok:
            print(f'[youtube] video search failed: {res.status_code} {res.text[:200]}', file=sys.stderr)
            return []
        return res.json().get('items', [])
    except Exception as e:
        print(f'[youtube] video search error: {e}', file=sys.stderr)
        return []


def youtube_comments(video_id: str, max_results: int = 20) -> list[dict]:
    try:
        res = requests.get(
            'https://www.googleapis.com/youtube/v3/commentThreads',
            params={
                'part': 'snippet',
                'videoId': video_id,
                'maxResults': max_results,
                'order': 'time',
                'textFormat': 'plainText',
                'key': YOUTUBE_API_KEY,
            },
            timeout=20,
        )
        if not res.ok:
            return []
        out = []
        for c in res.json().get('items', []):
            top = ((c.get('snippet') or {}).get('topLevelComment') or {}).get('snippet') or {}
            out.append({
                'text': top.get('textDisplay', ''),
                'author': top.get('authorDisplayName', ''),
                'posted_at': top.get('publishedAt', ''),
            })
        return out
    except Exception:
        return []


def collect_youtube() -> list[dict]:
    if not YOUTUBE_API_KEY:
        print('[youtube] api key missing', file=sys.stderr)
        return []
    items: list[dict] = []
    seen: set[str] = set()
    for kw in KEYWORDS:
        for video in youtube_search_videos(kw, max_results=5):
            vid = (video.get('id') or {}).get('videoId')
            if not vid:
                continue
            snippet = video.get('snippet') or {}
            title = snippet.get('title', '')
            channel = snippet.get('channelTitle', '')
            # 動画タイトルがマッチした場合は動画そのものをアイテム化
            if matches_keyword(title):
                key = f'video:{vid}'
                if key not in seen:
                    seen.add(key)
                    items.append({
                        'source': 'youtube',
                        'text': title,
                        'author': channel,
                        'url': f'https://www.youtube.com/watch?v={vid}',
                        'posted_at': snippet.get('publishedAt', ''),
                        'lang': '',
                        'video_title': title,
                        'kind': 'video_title',
                    })
            # コメントを掘る
            for c in youtube_comments(vid, max_results=20):
                if not matches_keyword(c['text']):
                    continue
                key = f'cmt:{vid}:{c["author"]}:{c["posted_at"]}'
                if key in seen:
                    continue
                seen.add(key)
                items.append({
                    'source': 'youtube',
                    'text': c['text'],
                    'author': c['author'],
                    'url': f'https://www.youtube.com/watch?v={vid}',
                    'posted_at': c['posted_at'],
                    'lang': '',
                    'video_title': title,
                    'kind': 'comment',
                })
            time.sleep(0.2)
    print(f'[youtube] collected {len(items)} items', file=sys.stderr)
    return items


# ---------- Reddit ----------

REDDIT_UA = 'oyoyo-feed/0.1 (https://oyoyo-corporate.onrender.com)'


def reddit_search(keyword: str, limit: int = 25) -> list[dict]:
    """Reddit 検索（OAuth なし、 User-Agent 指定）"""
    try:
        res = requests.get(
            'https://www.reddit.com/search.json',
            params={'q': keyword, 'limit': limit, 'sort': 'new', 'restrict_sr': 'false'},
            headers={'User-Agent': REDDIT_UA, 'Accept': 'application/json'},
            timeout=20,
        )
        if not res.ok:
            print(f'[reddit] search failed for {keyword}: {res.status_code}', file=sys.stderr)
            return []
        # Reddit が稀に HTML を返すケースに対応
        ct = res.headers.get('content-type', '')
        if 'json' not in ct:
            print(f'[reddit] non-json response for {keyword}: {ct}', file=sys.stderr)
            return []
        return res.json().get('data', {}).get('children', [])
    except Exception as e:
        print(f'[reddit] error for {keyword}: {e}', file=sys.stderr)
        return []


def collect_reddit() -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    for kw in KEYWORDS:
        for child in reddit_search(kw):
            d = child.get('data') or {}
            post_id = d.get('id', '')
            if not post_id or post_id in seen:
                continue
            seen.add(post_id)
            title = d.get('title', '')
            body = d.get('selftext', '')
            text = (title + '\n\n' + body).strip() if body else title
            if not matches_keyword(text):
                continue
            items.append({
                'source': 'reddit',
                'text': text,
                'author': 'u/' + d.get('author', ''),
                'url': 'https://www.reddit.com' + d.get('permalink', ''),
                'posted_at': datetime.fromtimestamp(d.get('created_utc', 0), tz=timezone.utc).isoformat(timespec='seconds') if d.get('created_utc') else '',
                'lang': '',
                'video_title': 'r/' + d.get('subreddit', ''),
            })
    print(f'[reddit] collected {len(items)} items', file=sys.stderr)
    return items


# ---------- Mastodon (複数インスタンス) ----------

MASTODON_INSTANCES = [
    'mstdn.jp',
    'mastodon.social',
    'pawoo.net',
    'fedibird.com',
]


def mastodon_tag_timeline(instance: str, tag: str, limit: int = 40) -> list[dict]:
    """Mastodon の公開ハッシュタグタイムライン (認証不要)"""
    try:
        res = requests.get(
            f'https://{instance}/api/v1/timelines/tag/{tag}',
            params={'limit': limit},
            headers={'User-Agent': REDDIT_UA},
            timeout=20,
        )
        if not res.ok:
            print(f'[mastodon/{instance}#{tag}] failed: {res.status_code}', file=sys.stderr)
            return []
        return res.json()
    except Exception as e:
        print(f'[mastodon/{instance}#{tag}] error: {e}', file=sys.stderr)
        return []


def collect_mastodon() -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    tags = ['oyoyo', 'オヨヨ']
    for instance in MASTODON_INSTANCES:
        for tag in tags:
            for status in mastodon_tag_timeline(instance, tag, limit=40):
                sid = status.get('id', '')
                key = f'{instance}:{sid}'
                if not sid or key in seen:
                    continue
                seen.add(key)
                html = status.get('content', '')
                text = re.sub(r'<[^>]+>', '', html).strip()
                if not matches_keyword(text):
                    continue
                acc = status.get('account') or {}
                handle = acc.get('acct', '')
                items.append({
                    'source': 'mastodon',
                    'text': text,
                    'author': f'@{handle}' if handle else '',
                    'url': status.get('url', ''),
                    'posted_at': status.get('created_at', ''),
                    'lang': status.get('language', '') or '',
                    'video_title': f'#{tag} @ {instance}',
                })
    print(f'[mastodon] collected {len(items)} items', file=sys.stderr)
    return items


# ---------- Lemmy ----------

LEMMY_INSTANCES = ['lemmy.world', 'sh.itjust.works', 'beehaw.org']


def lemmy_search(instance: str, keyword: str, limit: int = 20) -> list[dict]:
    try:
        res = requests.get(
            f'https://{instance}/api/v3/search',
            params={'q': keyword, 'type_': 'All', 'sort': 'New', 'limit': limit},
            headers={'User-Agent': REDDIT_UA},
            timeout=20,
        )
        if not res.ok:
            print(f'[lemmy/{instance}] search failed for {keyword}: {res.status_code}', file=sys.stderr)
            return []
        return res.json()
    except Exception as e:
        print(f'[lemmy/{instance}] error for {keyword}: {e}', file=sys.stderr)
        return []


def collect_lemmy() -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    for instance in LEMMY_INSTANCES:
        for kw in KEYWORDS:
            data = lemmy_search(instance, kw, limit=20)
            if not isinstance(data, dict):
                continue
            for post_wrap in data.get('posts', []):
                post = post_wrap.get('post') or {}
                pid = post.get('id', '')
                key = f'p{instance}:{pid}'
                if not pid or key in seen:
                    continue
                seen.add(key)
                text = ((post.get('name') or '') + '\n\n' + (post.get('body') or '')).strip()
                if not matches_keyword(text):
                    continue
                creator = post_wrap.get('creator') or {}
                comm = post_wrap.get('community') or {}
                items.append({
                    'source': 'lemmy',
                    'text': text,
                    'author': creator.get('name', ''),
                    'url': post.get('ap_id', '') or f'https://{instance}/post/{pid}',
                    'posted_at': post.get('published', ''),
                    'lang': '',
                    'video_title': comm.get('name', '') and f'!{comm["name"]}@{instance}',
                })
            for comment_wrap in data.get('comments', []):
                comment = comment_wrap.get('comment') or {}
                cid = comment.get('id', '')
                key = f'c{instance}:{cid}'
                if not cid or key in seen:
                    continue
                seen.add(key)
                text = comment.get('content', '') or ''
                if not matches_keyword(text):
                    continue
                creator = comment_wrap.get('creator') or {}
                items.append({
                    'source': 'lemmy',
                    'text': text,
                    'author': creator.get('name', ''),
                    'url': comment.get('ap_id', ''),
                    'posted_at': comment.get('published', ''),
                    'lang': '',
                    'video_title': instance,
                })
    print(f'[lemmy] collected {len(items)} items', file=sys.stderr)
    return items


# ---------- Hacker News (Algolia) ----------

def hn_search(keyword: str) -> list[dict]:
    try:
        res = requests.get(
            'https://hn.algolia.com/api/v1/search_by_date',
            params={'query': keyword, 'tags': '(story,comment)', 'hitsPerPage': 30},
            timeout=20,
        )
        if not res.ok:
            print(f'[hn] search failed for {keyword}: {res.status_code}', file=sys.stderr)
            return []
        return res.json().get('hits', [])
    except Exception as e:
        print(f'[hn] error for {keyword}: {e}', file=sys.stderr)
        return []


def collect_hn() -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    for kw in KEYWORDS:
        for hit in hn_search(kw):
            obj_id = hit.get('objectID', '')
            if not obj_id or obj_id in seen:
                continue
            seen.add(obj_id)
            text = hit.get('comment_text') or hit.get('story_text') or hit.get('title') or ''
            if not matches_keyword(text):
                continue
            items.append({
                'source': 'hackernews',
                'text': text,
                'author': hit.get('author', ''),
                'url': f'https://news.ycombinator.com/item?id={obj_id}',
                'posted_at': hit.get('created_at', ''),
                'lang': '',
                'video_title': hit.get('story_title', ''),
            })
    print(f'[hn] collected {len(items)} items', file=sys.stderr)
    return items


# ---------- main ----------

def main() -> None:
    bluesky_items = collect_bluesky()
    youtube_items = collect_youtube()
    reddit_items = collect_reddit()
    hn_items = collect_hn()
    mastodon_items = collect_mastodon()
    lemmy_items = collect_lemmy()
    all_items = bluesky_items + youtube_items + reddit_items + hn_items + mastodon_items + lemmy_items
    all_items.sort(key=lambda x: x.get('posted_at', ''), reverse=True)
    all_items = all_items[:MAX_ITEMS]

    sources = {}
    for item in all_items:
        sources[item['source']] = sources.get(item['source'], 0) + 1

    output = {
        'updated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'count': len(all_items),
        'sources': sources,
        'items': all_items,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'[main] saved {len(all_items)} items to {OUTPUT}')


if __name__ == '__main__':
    main()
