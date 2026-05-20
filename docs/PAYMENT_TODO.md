# Payment Feature — Remaining Implementation Tasks

> **Status snapshot (2026-05-03):** Backend core payment (checkout, webhook, escrow, wallet ledger) is
> complete and production-ready. The remaining gaps are:
> (1) user-facing withdrawal flow (backend + frontend),
> (2) admin finance real data (backend endpoint + frontend wiring),
> (3) minor frontend QR rendering note.

---

## Task 1 — Backend: User Withdrawal Endpoints

**Files to create/modify:**
- Create `backend/src/main/java/com/thuetoi/entity/WithdrawalRequest.java`
- Create `backend/src/main/java/com/thuetoi/repository/WithdrawalRequestRepository.java`
- Create `backend/src/main/java/com/thuetoi/dto/request/WithdrawalRequestDto.java`
- Create `backend/src/main/java/com/thuetoi/dto/response/WithdrawalResponse.java`
- Create `backend/src/main/java/com/thuetoi/controller/WithdrawalController.java`
- Extend `backend/src/main/java/com/thuetoi/service/WalletService.java`
- Create `backend/src/main/resources/db/migration/V8__withdrawal_requests.sql`

**Scope:**

### V8 Migration (SQL)
```sql
CREATE TABLE withdrawal_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    bank_name VARCHAR(128),
    account_number VARCHAR(128),
    account_holder VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING, APPROVED, REJECTED',
    note VARCHAR(512),
    payout_reference VARCHAR(255),
    processed_by BIGINT,
    processed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_wr_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Entity: `WithdrawalRequest`
JPA entity mapping the table above. Use `@Entity @Table(name="withdrawal_requests")`.
Fields: `id`, `userId`, `amount`, `bankName`, `accountNumber`, `accountHolder`,
`status`, `note`, `payoutReference`, `processedBy`, `processedAt`, `createdAt`, `updatedAt`.

### Repository: `WithdrawalRequestRepository`
```java
List<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
List<WithdrawalRequest> findAllByOrderByCreatedAtDesc();
```

### Request DTO: `WithdrawalRequestDto`
Fields: `amount` (BigDecimal, > 0), `bankName`, `accountNumber`, `accountHolder`.
Use `@Valid` + `@NotNull`/`@Positive` annotations.

### Response DTO: `WithdrawalResponse`
Record with: `id`, `amount`, `bankName`, `accountNumber`, `accountHolder`, `status`,
`note`, `createdAt`.

### Controller: `WithdrawalController` — `/api/v1/withdrawals`
```
POST  /api/v1/withdrawals          — freelancer submits request (role=freelancer only)
GET   /api/v1/withdrawals/my       — freelancer lists own requests
```
- `POST`: validate `amount <= user.balance`, subtract held amount from balance, create record with `PENDING`.
- Record a `withdrawal_hold` ledger entry in `wallet_ledger_entries` via `WalletService`.
- `GET /my`: return `findByUserIdOrderByCreatedAtDesc(uid)`.

### Extend `AdminService.processWithdrawal`
- On `APPROVED`: set `payoutReference` from `note`, add `payout_reference` field to `AdminWithdrawalResponse`.
- On `REJECTED`: restore `amount` back to `user.balance` and write a `balance_adjust` ledger entry.

### Security
In `SecurityConfig`, ensure `POST /api/v1/withdrawals` and `GET /api/v1/withdrawals/my`
require authentication (they inherit the existing authenticated filter chain — verify not whitelisted).

---

## Task 2 — Backend: Admin Finance Stats Endpoint

**Files to modify:**
- `backend/src/main/java/com/thuetoi/dto/response/admin/AdminStatsResponse.java`
- `backend/src/main/java/com/thuetoi/service/AdminService.java`
- `backend/src/main/java/com/thuetoi/repository/WalletLedgerEntryRepository.java`

**Scope:**

### Add to `WalletLedgerEntryRepository`
```java
@Query("SELECT COALESCE(SUM(e.amount),0) FROM WalletLedgerEntry e WHERE e.entryType = :type")
BigDecimal sumByEntryType(@Param("type") String type);
```

### Add fields to `AdminStatsResponse`
```java
BigDecimal totalPlatformFees;   // sum of platform_fee entries
BigDecimal totalEscrowIn;       // sum of escrow_in entries
BigDecimal totalReleased;       // sum of release_milestone entries
```

### Populate in `AdminService.getSystemStats()`
Use the new repository query to fill the three new fields from real ledger data.

---

## Task 3 — Frontend: Admin Finance Page — Real Data

**File:** `frontend/src/pages/admin/AdminFinancePage.jsx`

**Scope:**
Replace the two mocked calculations with real ledger data from `stats`:

```js
// REMOVE these lines (currently lines ~47–50 and ~109):
const platformRevenue = useMemo(() => (stats?.totalGmv || 0) * 0.1, [stats]);
// and:
{formatCurrency((stats?.totalGmv || 0) * 0.4)}
```

Replace with:
```js
// Platform revenue card: use stats.totalPlatformFees
{formatCurrency(stats?.totalPlatformFees || 0)}

// Escrow card: use stats.totalEscrowIn
{formatCurrency(stats?.totalEscrowIn || 0)}
```

Remove the hardcoded `+8.5%` growth badge — replace with `N/A` or remove entirely until
a real trend is computed.

---

## Task 4 — Frontend: Withdrawal Request Form in ProfilePage

**File:** `frontend/src/pages/ProfilePage.jsx`

**Scope:**
Add a withdrawal form inside the existing `WALLET` tab section (after the ledger card).
The form is only shown to users with `role === 'freelancer'`.

### Add API calls to `marketplaceApi.js`
```js
submitWithdrawal: (payload) => axiosClient.post('/v1/withdrawals', payload),
getMyWithdrawals: () => axiosClient.get('/v1/withdrawals/my'),
```

### State to add
```js
const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
const [withdrawals, setWithdrawals] = useState([]);
const [withdrawalLoading, setWithdrawalLoading] = useState(false);
const [withdrawalError, setWithdrawalError] = useState('');
const [withdrawalFieldErrors, setWithdrawalFieldErrors] = useState({});
```

### Load withdrawals alongside wallet (in `loadWallet`)
Add `marketplaceApi.getMyWithdrawals()` to the `Promise.all` call.

### Form UI (add after the ledger card)
- A `Card` with heading "Yêu cầu rút tiền / Withdrawal Request"
- Only rendered when `user?.role === 'freelancer'`
- Input fields: Amount (number), Bank Name, Account Number, Account Holder
- Submit button calls `marketplaceApi.submitWithdrawal(...)`, shows toast, refreshes wallet
- Below the form: a table/list of `withdrawals` showing amount, status, bank info, date

### i18n copy
Add Vietnamese and English copy keys for the withdrawal form. Follow the same
`getProfilePageCopy` pattern already used in the file. Minimum keys needed:
- `withdrawalTitle`, `withdrawalAmount`, `withdrawalBank`, `withdrawalAccount`,
  `withdrawalHolder`, `withdrawalSubmit`, `withdrawalSubmitting`, `withdrawalSuccess`,
  `withdrawalHistoryTitle`, `withdrawalEmpty`

---

## Verification Checklist (after all tasks)

- [ ] `mvn test` passes (add unit tests for `WithdrawalController` POST and GET /my, approve/reject)
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Manual flow: freelancer completes milestone → balance increases → submits withdrawal → admin approves → `payoutReference` stored → balance deducted
- [ ] AdminFinancePage shows real `totalPlatformFees` and `totalEscrowIn` (not `* 0.1 / * 0.4`)
- [ ] Withdrawal rejection correctly restores balance and writes ledger entry
