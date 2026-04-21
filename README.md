# Moodloviny

<div align="center">

<img src="extension/icon.png" alt="Moodloviny logo" width="120">

<br><br>

<a href="https://github.com/greeenos/Moodloviny">
  <img src="https://img.shields.io/badge/⬇ Stáhnout-GitHub-black?logo=github&style=for-the-badge" alt="Stáhnout">
</a>

<br><br>

<img src="assets/10ba1a1a-31be-4fcf-b2ee-d4f0502751a3.gif" width="100%" alt="Demo">

</div>

---

> ⚠️ **Upozornění:** Používejte zodpovědně a v souladu s pravidly školy. Projekt je určen hlavně pro vzdělávací a testovací účely. Je přísně **ZAKÁZÁNO** využívat toto rozšíření k podvodu. Každý uživatel nese riziko sám na sebe.

---

## Co to je

Jednoduché rozšíření pro **Chrome / Brave / Opera**, které pomáhá s otázkami v Moodle pomocí AI.

Podporuje 4 poskytovatele:

| Poskytovatel     | Poznámka                | Status                                      |
| ---------------- | ----------------------- | ------------------------------------------- |
| OpenAI           | Placené                 | ❌ Aktuálně nefunkční (pracuje se na opravě) |
| Google Gemini    | Zdarma pro studenty     | ✅ 100% funkční                              |
| Anthropic Claude | Placené                 | ❌ Aktuálně nefunkční (pracuje se na opravě) |
| OpenRouter       | Zdarma i placené modely | ✅ 100% funkční                              |

---

## Rychlý start

### 1. Stažení projektu

**Git (doporučeno)**

```bash
git clone https://github.com/greeenos/Moodloviny.git
cd Moodloviny
npm install
npm run build
```

**Bez Gitu** — na stránce repozitáře klikněte **Code → Download ZIP** a rozbalte.

### 2. Instalace rozšíření

1. Otevřete `chrome://extensions/`
2. Zapněte **Vývojářský režim** (vpravo nahoře)
3. Klikněte **Načíst rozbalené**
4. Vyberte složku `extension`

> Doporučujeme si rozšíření připnout do lišty prohlížeče.

### 3. První nastavení

1. Klikněte na ikonu Moodloviny
2. Vyberte **poskytovatele** (OpenAI / Gemini / Claude / OpenRouter)
3. Vložte **API klíč**
4. Vyberte **model**
5. Nastavení se **ukládá automaticky**

---

## Jak získat API klíč

| Poskytovatel | Odkaz |
|---|---|
| OpenAI | https://platform.openai.com/api-keys |
| Google Gemini | https://aistudio.google.com/app/apikey |
| Anthropic Claude | https://console.anthropic.com/api/keys |
| OpenRouter | https://openrouter.ai/keys |

---

## Jaký model vybrat

> Aktuální doporučení — duben 2026. Modely se mění rychle.

### OpenAI

| Model | Použití |
|---|---|
| `gpt-5.4` | Nejlepší kvalita |
| `gpt-5.4-mini` | Nejlepší poměr cena/výkon |
| `gpt-5.4-nano` | Nejlevnější rychlá varianta |

### Google Gemini

| Model | Použití |
|---|---|
| `gemini-3.1-pro-preview` | Nejlepší kvalita |
| `gemini-2.5-pro` | Stabilní univerzální volba |
| `gemini-2.5-flash` | Nejlepší rychlost a cena |

### Anthropic Claude

> Claude Opus je pro testové otázky zbytečně drahý — není potřeba.

| Model | Použití |
|---|---|
| `claude-sonnet-4-6` | Nejlepší kvalita/cena |
| `claude-haiku-4-5` | Nejrychlejší a nejlevnější |

### OpenRouter

Modely jsou v rozšíření řazené: nejdřív nejlepší **zdarma**, pak **placené**.

**Zdarma:**

| Model |
|---|
| `qwen/qwen3-coder:free` |
| `openai/gpt-oss-120b:free` |
| `meta-llama/llama-3.3-70b-instruct:free` |
| `google/gemma-4-31b-it:free` |
| `nvidia/nemotron-3-super-120b-a12b:free` |

**Placené:**

| Model |
|---|
| `anthropic/claude-sonnet-4.6` |
| `openai/gpt-5.4` |
| `google/gemini-2.5-pro` |
| `openai/gpt-5.4-mini` |

### Rychlé doporučení

| Situace | Doporučený model |
|---|---|
| Nejlepší kvalita | `gpt-5.4`, `claude-sonnet-4-6`, `gemini-3.1-pro-preview` |
| Rychlost a cena | `gpt-5.4-mini`, `gemini-2.5-flash`, `claude-haiku-4-5` |
| Zdarma | `qwen/qwen3-coder:free`, `openai/gpt-oss-120b:free` |

---

## Podporované typy otázek

| ✅ Podporováno | ❌ Nepodporováno |
|---|---|
| Jedna správná odpověď (radio) | Nahrávání souborů |
| Více správných odpovědí (checkbox) | Některé složité interaktivní prvky |
| Rozbalovací seznam (select) | |
| Číselné pole | |
| Textové pole | |
| Delší text (Atto editor) | |
| Seřazení položek | |
| Párování | |
| Drag & drop do textu (ddwtos) | |

---

## Režimy

| Režim | Popis |
|---|---|
| **Automatické vyplnění** | Odpověď se zapíše rovnou do pole |
| **Schránka** | Odpověď se zkopíruje — vložte přes Ctrl/Cmd+V |
| **Otázka↔Odpověď** | Přepínání textu otázky a odpovědi |

---

## Nastavení — přehled možností

| Možnost | Popis |
|---|---|
| Efekt psaní | Odpověď se zobrazuje postupně jako psaní |
| Efekt mouseover | Aktivace po najetí myší na odpovědi |
| Neomezené pokusy | Rozšíření se po kliknutí nevypne |
| Uložit historii | Lepší kontext, ale vyšší spotřeba tokenů |
| Zahrnout obrázky | Vhodné pro otázky s grafy a obrázky |
| Kód aktivace | Ruční ochrana — rozšíření se zapne jen po zadání kódu |

---

## Nejčastější problémy

### API klíč nefunguje
- Zkontrolujte, že je vložen celý klíč bez mezer
- Ověřte, že klíč není zrušený nebo bez kreditu

### Nenačítají se modely
- Klíč je neplatný nebo chybí oprávnění
- Služba může mít dočasný výpadek
- U vlastního endpointu zkontrolujte URL

### Odpověď se nevyplní do pole
- Zkuste zapnout **Efekt mouseover**
- Nejdřív klikněte do pole, pak spusťte akci

---

## Pro vývojáře

### Build příkazy

```bash
npm run build       # plný build (lint + prettier + rollup)
npm run fastBuild   # jen rollup
npm run lint
npm run prettier
```

### Struktura projektu

```
Moodloviny/
├── extension/      # zkompilované rozšíření
├── src/            # zdrojový kód (TypeScript)
│   ├── background/ # content script (logika otázek)
│   ├── popup/      # UI rozšíření
│   └── service-worker/
└── package.json
```

---

## Licence

MIT

## Příspěvky

Pull requesty jsou vítané.

---

## ☕ Podpořit projekt

Jakákoliv podpora chudého studenstva v těžkých dobách se počítá.

**USDC na Polygon síti:**

```
0x7E7d37CB49e34C62A4F299B74e784FfBEeb3050e
```

Díky moc! 🙏
