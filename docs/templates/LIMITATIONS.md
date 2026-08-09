# What Your Agent Employees Cannot Do (And How to Deal With It)

The templates fix what's fixable in instructions. These four limits are structural — no template wording removes them. Each comes with the working arrangement that manages it.

## 1. They only know what's in the folder — and the folder doesn't update itself

Your employee cannot log into QuickBooks, read your email, or check your bank. It knows exactly what's in `company/` — nothing else, and nothing newer. Between your exports, the world moves and the folder doesn't. The templates make agents *report* data age (file dates), but they can't fetch fresh data.

**How to deal with it:**
- Make a **weekly export ritual** (calendar reminder): dump sales, expenses, and any new contracts into `company/`, then ask for a report. Data discipline in, quality out.
- Treat the data-age line at the top of each report as seriously as the priorities. "Expenses: 41 days old" means the expense conclusions are 41 days old too.
- If you use tools with MCP connectors (QuickBooks, HubSpot, etc.), those can replace parts of the manual export — but that's separate setup, and connectors have their own access/privacy trade-offs.

## 2. They have amnesia between sessions

An agent invocation starts blank: no memory of last week's conversation, your verbal instructions, or promises made. The templates work around this by making the **reports folder the employee's memory** — each run reads its own previous reports and follows up. But that only covers what's written down.

**How to deal with it:**
- Anything you want remembered goes **in a file**, not in chat. Standing instructions belong in `how-we-work.md`; decisions belong in the reports folder.
- Never delete the reports folder — it's the employee's entire work history and the follow-up loop depends on it.
- If you tell the agent something important mid-conversation, end with: "add that to how-we-work.md" — otherwise it's gone next session.

## 3. Their arithmetic is unreliable

Language models compute by reading, not by calculating. Summing an expense sheet or deriving a month-over-month percentage can be silently wrong while looking perfectly cited. The templates force every self-computed figure to be marked `(calc — verify)` — but marking doesn't make it correct.

**How to deal with it:**
- **Never move money on a `(calc)` number** without re-checking it in a spreadsheet. Copied numbers (cited to a file) are trustworthy; calculated ones are drafts.
- Pre-compute totals where you can: if your accounting tool exports a summary row, include it — the agent citing your total beats the agent deriving its own.
- Technical users can grant `Bash` so the agent computes with real tools (`awk`, a script) instead of by eyeball — at the cost of giving that employee command execution. Least privilege still applies.

## 4. Delegation is probabilistic, and this is a developer tool

Claude decides *by itself* when to hand work to your employee, based on the description field. A good "Use PROACTIVELY when…" makes that reliable, not guaranteed — sometimes Claude answers directly instead of delegating. And underneath, this all runs in Claude Code: sessions, a terminal, files — built for developers, usable by owners, but the seams show.

**How to deal with it:**
- When it matters, **name the employee**: "use the operations-manager agent" removes all ambiguity. Delegation-by-description is a convenience, not the contract.
- The subagent doesn't see your conversation — it gets the task prompt plus its own file. If the task depends on something you said earlier, repeat it in the request (or better: it should already be in a file, see limit 2).
- Expect a learning curve if you're not technical. The one-time setup (folders, gitignore, validation) is the steepest part; daily use is just "ask for a report, drop in new files."

---

**The honest summary:** these employees are excellent at *reading everything, forgetting nothing that's written down, structuring chaos, and never getting bored* — and structurally bad at *staying current, remembering conversations, doing math, and taking initiative on their own schedule*. Arrange the work so the first list is their job and the second list stays yours, and the arrangement holds.
