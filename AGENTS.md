# Guía rápida para agentes

## Resumen del proyecto
- App móvil/web con Expo + React Native usando expo-router.
- Flujo de autenticación con roles ADMIN y PATIENT.
- UI basada en react-native-paper y un tema centralizado en lib/theme.ts.

## Estructura principal
- app/: pantallas y rutas (expo-router).
  - admin/: vistas administrativas (calendario, estudios, horarios, perfil, usuarios).
  - patient/: vistas para pacientes (calendario, estudios, horarios, perfil).
- lib/: lógica compartida (auth, api, storage, schedule, studies, profile, horarios, theme).
- assets/: íconos y recursos.
- app.json: configuración de Expo.

## Flujo de navegación
- app/index.tsx redirige según autenticación y rol.
- app/login.tsx maneja el inicio de sesión.
- app/_layout.tsx define el Stack y proveedores (AuthProvider, PaperProvider).

## Datos y persistencia
- Auth y perfil: guardados localmente con SecureStore en móvil y localStorage en web.
- Calendario, horarios y estudios locales: persistidos en storage local.
- Estudios remotos y perfiles remotos: consumen API vía axios en lib/api.ts.

## Variables de entorno
- EXPO_PUBLIC_API_URL es obligatoria para el backend.

## Comandos disponibles
- start: expo start
- android: expo run:android
- ios: expo run:ios
- web: expo start --web

## Convenciones de código
- TypeScript estricto en tsconfig.json.
- Rutas y pantallas por convención de expo-router en app/.
- Estilos y colores centralizados en lib/theme.ts.
