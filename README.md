### SwapChat 3.0

> **TODO: STAMP CHUNK MANAGEMENT** — Currently using `Stamper.fromBlank()` which starts at bucket index 0 every time. Stamp state is persisted in localStorage but this is fragile. Need proper stamp bucket state management: either query the Bee node for current utilisation, or persist state more robustly. Without this, stamp index collisions will cause upload failures after localStorage is cleared.

---

Implementing first stab hack of Swapchat 2.0 using [swapchat engine 0.0.1](https://github.com/significance/swapchat-engine), a 2022 remake of the Swarm MAD 2019 [classic](https://github.com/felfele/swapchat) (credits @agazo, @nolash and myself)

Beeta software, use at your own risk! <3 🐝🐝🐝 

```
yarn
yarn start
```
