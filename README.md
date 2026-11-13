# Mehfil offline taash

Open `index.html` in Chrome or Edge. Keep `engine.js`, `app.js`, `style.css`, and `tokens.css` beside it. No installation, server, hosting, account or network connection is needed.

For Vercel, import this GitHub repository. The included config builds the static `dist` folder with `npm run build`. Run `npm test` before deployment. The deployed site needs a connection to load, but all gameplay runs in the browser without a game server.

Phone landscape mode places the table and hand side by side, respects safe-area insets and keeps the hand independently scrollable for large Thulla pickups. Portrait and desktop layouts remain available; no orientation lock is required.

- Bhabhi / Thulla: one human and three computer players.
- Double Sar Rang: you and Sara against Ali and Hamza. Two consecutive tricks won by either teammate collect the central pile. Collection resets the streak. The last trick collects any remaining pile. The team with at least seven collected tricks after all thirteen wins.
- Number Milao is still a design preview, linked separately.

Click a lit card to play. Dim cards cannot be played on that turn. The menu pauses bots; returning to the table resumes. Background tabs also pause. A refresh or closed tab loses the current game. A new deal requires the Start button, or a confirmed restart from the menu.

Rules are listed in the app. Thulla uses the first-trick discard and waste-draw power rules from https://www.pagat.com/inflation/getaway.html. Optional taking of another player's whole hand is not included. Rang uses open trump selection from the first five cards and the user's team collection rule, with the remaining basic rules from https://www.pagat.com/whist/rang.html. There is no coat/session scoring.

Choose Easy, Medium or Hard before starting either game. The level applies to all three computer players (including Sara in Rang), stays fixed for that deal, and is preserved on rematch. Medium is the default.

Easy chooses random legal cards. Medium uses basic suit and partnership tactics. Hard remembers public missing-suit information and discarded cards, protects trumps, and chooses safer leads and discards. No level sees opponents' hands or hidden waste draws. These are heuristic opponents, not expert or guaranteed unbeatable players.

The original 29-screen design remains in `design.html` and `design.js`.

Checks: `node engine.test.cjs` (rule and strategy cases, privacy checks, 1,200 seeded complete games across all levels, card conservation) and `node check.cjs` (original design renders and both full UI flows at every level with a simulated clock).
