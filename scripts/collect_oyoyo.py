"""Bluesky と YouTube から "oyoyo"/"オヨヨ" 言及を収集して data/oyoyo-feed.json に保存する。"""
import os
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

OUTPUT = Path('data/oyoyo-feed.json')
MAX_ITEMS = 30
KEYWORDS = ['oyoyo', 'オヨヨ', 'ｵﾖﾖ']

BLUESKY_HANDLE = os.environ.get('BLUESKY_HANDLE', '').strip()
BLUESKY_APP_PASSWORD = os.environ.get('BLUESKY_APP_PASSWORD', '').strip()
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '').strip()


def matches_keyword(text: str) -> bool:
    if not text:
        return False
    t = text.lower()
    return any(k.lower() in t for k in KEYWORDS)


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


# ---------- main ----------

def main() -> None:
    bluesky_items = collect_bluesky()
    youtube_items = collect_youtube()
    all_items = bluesky_items + youtube_items
    all_items.sort(key=lambda x: x.get('posted_at', ''), reverse=True)
    all_items = all_items[:MAX_ITEMS]

    output = {
        'updated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'count': len(all_items),
        'sources': {
            'bluesky': sum(1 for i in all_items if i['source'] == 'bluesky'),
            'youtube': sum(1 for i in all_items if i['source'] == 'youtube'),
        },
        'items': all_items,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'[main] saved {len(all_items)} items to {OUTPUT}')


if __name__ == '__main__':
    main()
