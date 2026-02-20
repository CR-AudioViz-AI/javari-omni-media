# 🏗️ JAVARI OMNI MEDIA - CORE SERVICES ARCHITECTURE

## **"No App Stands Alone"**

This app connects to:
1. **craudiovizai.com** - Auth, payments, credits, users
2. **javari.ai** - AI operations, docs, support

---

## 🌐 THE ECOSYSTEM

```
┌─────────────────────────────────────┐
│    CRAUDIOVIZAI.COM (Core)         │
│                                     │
│  ✅ Authentication                  │
│  ✅ Payments (Stripe/PayPal)        │
│  ✅ Credits System                  │
│  ✅ User Management                 │
│  ✅ Subscriptions                   │
│  ✅ Admin Dashboard                 │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
  ┌───▼──┐      ┌──▼────────────┐
  │JAVARI│      │ OMNI MEDIA    │
  │  AI  │◄────┤  (This App)    │
  │      │      │                │
  │Docs  │      │ Media Org      │
  │AI    │      │ File Upload    │
  │      │      │ Metadata       │
  └──────┘      └────────────────┘
```

---

## 🔌 INTEGRATION

### **SDK Usage:**

```typescript
import { getCore, useCoreCredits, useJavariAI } from '@/lib/core/craudiovizai-sdk'

// Get user session
const core = getCore()
const user = await core.getSession(token)

// Spend credits
const credits = useCoreCredits(userId)
await credits.spend(15, 'create_moment')

// Call AI
const javari = useJavariAI(userId)
const result = await javari.createMoment(input)
```

---

## 📦 WHAT LIVES WHERE

### **craudiovizai.com:**
- User accounts
- Credits & payments
- Subscriptions
- Cross-app data

### **javari.ai:**
- AI routing
- Model management
- Docs & support

### **This App:**
- Media files
- Metadata
- App preferences
- (NO users, payments, credits)

---

## 🚀 SETUP

```bash
# Required env vars
CRAUDIOVIZAI_API_URL=https://api.craudiovizai.com
CRAUDIOVIZAI_APP_SECRET=<from core admin>
JAVARI_AI_URL=https://api.javari.ai
JAVARI_AI_API_KEY=<from javari admin>
```

**See ARCHITECTURE.md for full documentation.**
