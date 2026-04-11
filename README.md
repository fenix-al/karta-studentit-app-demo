# Karta e Studentit Shkoder

## Cfare eshte ky projekt?

Ky projekt eshte aplikacioni mobil i platformes **Karta e Studentit Shkoder**.

Ai lidhet me backend-in WordPress dhe u sherben 2 paleve kryesore:

- **studenteve**
- **bizneseve partnere**

Qellimi i projektit eshte qe karta e studentit te mos jete vetem nje karte identifikimi, por nje mjet real per:

- perfitime dhe zbritje
- dhurata dhe loyalty rewards
- raffle / shorte
- kurse dhe mundesi
- aktivitete dhe module rinore
- verifikim nga bizneset permes QR scan

---

## Cfare ben aplikacioni?

### Per studentin

Studenti mund te:

- hyje ne aplikacion me llogarine e vet
- shohe karten digjitale
- gjeje biznese dhe perfitime
- perfitoje nga oferta dhe zbritje
- grumbulloje pike
- hape dhurata dhe loyalty rewards
- marre pjese ne raffle
- shikoje kurse, mundesi, startup, ACT4 dhe KVR
- shikoje historikun dhe profilin personal

### Per biznesin

Biznesi mund te:

- hyje me login biznesi
- shohe dashboard-in me statistika reale
- shohe top studentet e skanuar
- dergoje kerkesa per promo / fushata
- shohe profilin e biznesit
- skanoje QR-ne e kartes se studentit
- verifikoje vlefshmerine e kartes

---

## Si funksionon sistemi?

Projekti ka 2 pjese kryesore:

### 1. Mobile app

Workspace:

- `d:\karta-studentit-app`

Teknologji kryesore:

- Expo
- React Native
- TypeScript

### 2. Backend / API

Workspace:

- `d:\karta e studentit shkoder`

Teknologji kryesore:

- WordPress
- custom plugin
- REST API endpoints

Backend i jep aplikacionit:

- autentikim
- te dhena studenti
- te dhena biznesi
- offers / rewards / raffle data
- business scan logic
- cooldown dhe validim

---

## Gjendja aktuale

Aktualisht projekti ka keto pjese te rendesishme ne funksion:

- login studenti
- login biznesi
- role-based routing
- business panel MVP
- scanner QR per biznesin
- rewards / loyalty / raffle flows
- EAS build setup per Android

Gjithashtu, tab-i **Perfitimet** eshte optimizuar qe te mos ribeje reload kot sa here hapet.

---

## File te rendesishem

- [App.tsx](d:/karta-studentit-app/App.tsx)
- [app.json](d:/karta-studentit-app/app.json)
- [eas.json](d:/karta-studentit-app/eas.json)
- [package.json](d:/karta-studentit-app/package.json)
- [api.ts](d:/karta-studentit-app/src/services/api.ts)
- [AuthContext.tsx](d:/karta-studentit-app/src/context/AuthContext.tsx)
- [HomeScreen.tsx](d:/karta-studentit-app/src/screens/HomeScreen.tsx)
- [RewardsScreen.tsx](d:/karta-studentit-app/src/screens/RewardsScreen.tsx)
- [OffersHubScreen.tsx](d:/karta-studentit-app/src/screens/offers/OffersHubScreen.tsx)
- [BizHomeScreen.tsx](d:/karta-studentit-app/src/screens/biz/BizHomeScreen.tsx)

---

## Android Build

Per Android testing:

```bash
eas build --platform android --profile preview --clear-cache
```

Per production Play Store build:

```bash
eas build --platform android --profile production
```

---

## Ne nje fjali

**Karta e Studentit Shkoder** eshte nje aplikacion mobil qe lidh studentet, bizneset dhe bashkine ne nje sistem te vetem per perfitime, verifikim dhe sherbime digjitale.

