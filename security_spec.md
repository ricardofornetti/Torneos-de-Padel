# Security Specification & Test Protocol

## 1. Data Invariants

- **Tournament Owners Only**: Only authenticated coordinators/admins can create or modify tournaments, courts, players, and match scores.
- **Match Scoring**: Scorers can only submit valid score strings consisting of digits and hyphens, and the update must prevent modifying the tournament's history once the tournament status is completed, unless overridden by an admin.
- **DNI Guard**: User profiles must only allow owners of that DNI or admins to inspect or modify personal PII fields (like phone, email, DNI).
- **Time/Timestamp verification**: All creations and updates of tournament matches must use proper timestamp verifications.

## 2. The "Dirty Dozen" (Malicious Payloads)

1. **Identity Spoofing on Player Profile**: A logged-in user with UID `attacker_uid` trying to create or update a player profile with ID `victim_uid`. This should be blocked.
2. **Privilege Escalation**: A normal user attempting to designate themselves as an admin or modifying an admin-only collection.
3. **Ghost Fields injection (Shadow Update)**: Attempting to modify a tournament matches collection by injecting a hidden `isVerifiedByPro` ghost boolean field.
4. **Invalid Path Poisoning**: Attempting to query or update using string IDs that contain dangerous recursive path patterns.
5. **Score Poisoning**: Submitting a match score that is not a string but a nested object or has a malicious string buffer size.
6. **Bypassing Inscription Status limits**: Trying to set inscription status of a Pair to `confirmed` as a normal non-admin user.
7. **Invalid Game Status Jump**: Updating a match's winner pair ID of an already closed tournament status.
8. **DNI/PII Exfiltration**: A spectator trying to perform a `get` query on private PII data of a registered Player without owning it or being an admin.
9. **Blanket Query Scraping**: Triggering a query on all players with emails without specific filter parameters.
10. **Orphaned Registration**: Creating a Pair registered to a non-existent or deleted `tournamentId`.
11. **Double Booking Overlap**: Forcing an update to booking dates that ignores existing reservation ranges.
12. **Double Scoring**: Writing multiple outcomes to a single settled match to trigger artificial points inflation.

These payloads serve as security benchmarks. The security rules will be designed to return `PERMISSION_DENIED` for all these malicious scenarios.
