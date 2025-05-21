# Proof of Reserve Dashboard

Merkeziyetsiz borsaların Proof of Reserve (PoR) verilerini görüntüleyebileceğiniz modern ve şık bir web dashboard uygulaması.

## Özellikler

- 🔐 JWT tabanlı kimlik doğrulama
- 📊 Borsa yönetimi
- 📝 Liste yönetimi
- 💼 Cüzdan ve token yönetimi
- 📸 Snapshot alma ve görüntüleme
- 🌓 Karanlık/Aydınlık tema desteği

## Teknolojiler

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Axios
- React Query
- React Hot Toast

## Başlangıç

1. Projeyi klonlayın:
```bash
git clone https://github.com/yourusername/proof-of-reserve-dashboard.git
cd proof-of-reserve-dashboard
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## API Yapılandırması

Uygulama varsayılan olarak `https://api.lytera.io` API'sini kullanır. API URL'sini değiştirmek için `src/utils/api.ts` dosyasını düzenleyebilirsiniz.

## Dağıtım

Bu proje Vercel'de dağıtıma hazırdır. Dağıtım için:

1. Projeyi GitHub'a push edin
2. Vercel'de yeni bir proje oluşturun
3. GitHub reponuzu seçin
4. Dağıtım ayarlarını yapılandırın
5. Deploy edin

## Lisans

MIT
