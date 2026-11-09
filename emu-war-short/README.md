# Stickman Short template

```bash
npm install
TTSFORFREE_API_KEY=your-key node scripts/voice.mjs story.json   # voices every scene with TTSForFree
npx remotion studio src/index.ts                                # preview, or:
npx remotion render src/index.ts short out/short.mp4
```

Edit `story.json` to make a new video (fields: `../references/schema.md`).
Get an API key at https://ttsforfree.com/en/profile/ (API credentials). Voice: TTSForFree · https://ttsforfree.com
