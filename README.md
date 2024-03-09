# Extract APK Data
extract and view data inside APK file in browser client

## Development
- `npm install`
- `npm run dev`
- open `http://localhost:3000`

## Todo
- [x] Load APK
- [x] Load AndroidManifest.xml
- [x] Get Image/Icon
- [x] Get link/url inside classes.dex
- [ ] Get resource name and value
- [x] Get all permission
- [ ] update json data permission description
- [x] custom regex for user to search
- [ ] dark mode
- [ ] refactor & clean code

## Specific Features
there some scammer that disguise their scamming apk to look like wedding invitation, invoice, receipt, etc. that apk actually SMSthief and send SMS to telegram bot. go to `/scam-apk` to get information about the bot and you can spam the bot to reach limit or force the bot to logout.
- [x] detect bot token (only work if the bot token is hardcoded in the apk)
- [x] get information about telegram bot and user whoe receive the message
- [x] spam the bot
- [x] force the bot to logout