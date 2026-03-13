# Guia rapida para agentes

## Resumen del proyecto
- App movil y web con Expo + React Native.
- Navegacion basada en `expo-router` con rutas separadas para `ADMIN` y `PATIENT`.
- UI construida con `react-native-paper`, `react-native-paper-dates` y tema centralizado en `lib/theme.ts`.
- Backend consumido por `axios` desde `lib/api.ts`.

## Estructura principal
- `app/`: rutas y pantallas.
- `app/admin/`: vistas de administracion como `home`, `horarios`, `profile`, `usuarios`, `tracking`, `gallery` y `novedades`.
- `app/patient/`: vistas de paciente como `home`, `horarios`, `profile`, `study`, `tracking`, `gallery` y `novedades`.
- `lib/`: logica compartida (`auth`, `api`, `storage`, `schedule`, `studies`, `profile`, `horarios`, `gallery`, `theme`).
- `assets/`: iconos, splash e imagenes de la app.
- `app.json`: configuracion de Expo.
- `package.json`: scripts de desarrollo, lint y typecheck.

## Flujo de navegacion
- `app/_layout.tsx` monta `SafeAreaProvider`, `PaperProvider` y `AuthProvider`, y configura el `Stack`.
- `app/index.tsx` redirige segun autenticacion y rol hacia `/login`, `/admin/home` o `/patient/home`.
- `app/login.tsx` maneja el inicio de sesion contra el backend.
- El header reutiliza la marca de la app y vuelve al home correspondiente segun el rol actual.

## Auth y sesion
- `lib/auth.tsx` resuelve login/logout, hidrata sesion desde storage local y expone `useAuth()`.
- El backend de autenticacion responde con `token` y `user`.
- El token se inyecta en `axios` mediante `setAuthToken`.

## Datos y persistencia
- `lib/storage.ts` usa `expo-secure-store` en nativo y `localStorage` en web.
- Calendario (`lib/schedule.ts`), horarios (`lib/horarios.ts`), perfiles locales (`lib/profile.ts`) y estudios locales (`lib/studies.ts`) se guardan en storage local.
- Estudios remotos, perfiles remotos y galeria remota consumen API HTTP.
- `lib/gallery.ts` tambien sube imagenes y videos a Cloudinary antes de registrar la referencia en la API.

## Variables de entorno
- `EXPO_PUBLIC_API_URL`: URL base publica del backend. Si no termina en `/api`, `lib/api.ts` la completa automaticamente.
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`: cloud name para cargas de galeria.
- `EXPO_PUBLIC_CLOUDINARY_PRESET`: upload preset unsigned para Cloudinary.
- Si `EXPO_PUBLIC_API_URL` no existe, la app usa un fallback productivo definido en `lib/api.ts`.

## Comandos disponibles
- `npm run start`: inicia Expo.
- `npm run android`: corre la app en Android.
- `npm run ios`: corre la app en iOS.
- `npm run web`: inicia Expo para web.
- `npm run lint`: ejecuta ESLint.
- `npm run typecheck`: ejecuta TypeScript sin emitir archivos.

## Convenciones de codigo
- TypeScript estricto en `tsconfig.json`.
- Rutas y pantallas siguen la convencion de `expo-router` dentro de `app/`.
- Mantener estilos, colores y tema en `lib/theme.ts` cuando sea posible.
- Reutilizar helpers de `lib/` antes de duplicar logica en pantallas.
- Tener en cuenta diferencias web/nativo al tocar almacenamiento, seleccion de archivos o uploads.

## Notas utiles para cambios
- Hay una carpeta `CreandoLazos-main/` dentro del workspace que no forma parte del flujo principal de la app; evitar mezclar cambios ahi salvo pedido explicito.
- Algunos archivos muestran texto con acentos mal codificados en consola de Windows, pero conviene guardar nuevos cambios en texto limpio y consistente.
