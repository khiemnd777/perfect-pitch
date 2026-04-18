# Perfect Pitch

Perfect Pitch la ung dung web luyen cam am chay hoan toan o client, duoc xay dung de luyen nghe not don, hop am 2 not, melody ngan, quang, va arpeggio bang piano sample cuc bo.

## Muc tieu san pham

- Cham diem ngay khi nguoi choi chon dap an va hien dap an dung lap tuc.
- Giu chat am tu nhien bang piano sample thay vi synth.
- Ho tro luyen tap nhanh tren trinh duyet, khong can backend.

## Tinh nang hien co

- 5 mode luyen tai: `single`, `double`, `melody`, `interval`, `arpeggio`.
- 3 cap do kho co dinh: `easy`, `medium`, `hard`.
- Tu dong tang/giam do kho theo streak dung/sai.
- Luu tien do rieng theo tung mode trong local storage.
- Replay phat lai dung payload cau hoi hien tai, khong sinh cau hoi moi.
- Sinh cau hoi theo quy tac xac dinh, co the test voi seed khi can.

## Cong nghe

- `Bun`
- `Vite`
- `React 19`
- `TypeScript`
- `Tone.js`
- `Vitest`
- `ESLint`

## Cai dat va chay

```bash
bun install
bun run dev
```

Ung dung mac dinh chay tren Vite dev server. Audio chi duoc mo sau user gesture dau tien de tranh autoplay restriction cua trinh duyet.

## Scripts

```bash
bun run dev
bun run lint
bun run test:run
bun run build
```

## Cau truc du an

- `src/app`: app shell, mode flow, preload, grading state, session stats.
- `src/features/audio`: Tone startup, sample preload, playback, replay, cleanup.
- `src/features/game`: cham diem va progression theo streak.
- `src/features/question-bank`: sinh cau hoi cho 5 mode va 3 muc do.
- `src/shared`: public types, helper am nhac, random utility.
- `public/audio/piano`: piano samples duoc su dung khi phat am.

## Quy tac nghiep vu

- `single`: chi doan pitch class, khong doan octave.
- `double`: dap an phai ro rang va nhan cap not phai duoc sap xep tang dan.
- `melody`: distractor phai cung do dai va tranh trung nhin.
- Moi cau hoi phai co dung 4 lua chon duy nhat va chi 1 dap an dung.
- Moi thay doi sample map phai giu du sample coverage trong dai `C4-B5`.

## Kiem tra truoc khi publish

```bash
bun run lint
bun run test:run
bun run build
```

Ngoai ra nen kiem tra thu cong:

- first-play audio sau user gesture dau tien
- replay trong ca 5 mode
- immediate grading
- next-question reset

## Tai lieu noi bo

- `AGENTS.md`: quy uoc lam viec cho agent trong repo.
- `memory.md`: thong tin ben vung cua du an.
- `docs/current-context.md`: trang thai thuc thi hien tai va next focus.
