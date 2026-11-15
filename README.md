CRICKET LIVE TV — PROXY / JSON SOURCE UPDATE

FILES
- Cricket_Live_TV.html : updated frontend; source sync now retains every server candidate for each channel.
- server.js            : updated Express backend and M3U/JSON source parser.
- worker.js            : Cloudflare Worker proxy for the existing Render API.
- package.json         : Node dependencies and start command.

PARSER BEHAVIOUR
1. For JSON channel entries, proxied_url is preferred over backup_proxied_url and raw_url.
2. Backup proxy and raw URL are retained as alternate server entries rather than discarded.
3. The same candidate ordering is used for nested event server groups such as CnpTV,
   stream_url_alpha, stream_url_bravo and streams.
4. M3U parsing reads EXTINF channel name/group/logo, EXTVLCOPT user-agent/referrer/cookie,
   and EXTHTTP request headers.
5. HLS (.m3u8), DASH (.mpd), and common direct media formats are detected. For proxy URLs,
   the underlying encoded stream URL is considered when determining the media type.
6. The frontend source auto-sync rebuilds source-managed server entries while preserving
   manually added links.
7. For streams you own or are authorized to play, source JSON may supply ClearKey material
   in drm_key / drmKey / clearKeys / clear_keys / content_key / contentKey / drmLicense /
   licenseKey, or as key_id + key. The parser passes this explicit value to Shaka's
   ClearKey configuration. It does not extract keys from cookies, signed tokens, or CDN URLs.

DEPLOYMENT
1. Replace the current frontend HTML with Cricket_Live_TV.html.
2. Deploy server.js to the existing Render service. Keep the existing GITHUB_TOKEN
   environment variable and repository configuration. Install dependencies with:
      npm install
   Start with:
      npm start
3. Deploy worker.js to Cloudflare only if the current frontend uses this Worker. Keep
   RENDER_API_BASE pointed at the existing Render API.
4. Add the M3U or JSON feed URL in the frontend Stream Sources Pool. The parser fetches
   the source when syncing; do not paste expiring access tokens into source code.

TESTS RUN
- Node syntax check: server.js and worker.js passed.
- Inline frontend JavaScript syntax check passed.
- Parser smoke tests passed for JSON channel entries with proxy/backup/raw URLs,
  event server groups, HLS/DASH detection, and M3U request metadata.

IMPORTANT DRM / ACCESS NOTE
For content you own or are authorized to play, explicitly supplied ClearKey key IDs and
keys can be passed to Shaka Player as optional clearKeys configuration. This does not
bypass provider authorization, entitlement checks, or license restrictions. A URL, cookie,
or key alone does not guarantee playback; CORS, token validity, browser support, and the
provider's authorization method still apply. Never use keys or streams without permission.

TOKEN NOTE
The sample playlist's signed cookie/token was not hardcoded into these files. Signed
CDN tokens expire and must be refreshed by the feed/provider when they expire.****
