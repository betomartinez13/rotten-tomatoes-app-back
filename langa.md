# CineRank — Cambios en el Backend y Tareas para Frontend

Hola! Te resumo todos los cambios recientes del backend y lo que necesitas implementar en el frontend.

---

## ⚠️ Cambios Breaking (requieren modificar pantallas existentes)

### 1. Registro ya NO devuelve tokens

El endpoint `POST /auth/register` **ya no devuelve tokens ni datos del usuario**. Ahora envía un código de 6 dígitos al email del usuario y responde:

```json
{ "message": "Account created. Please check your email to verify your account." }
```

**Qué cambiar:** Después del registro, en lugar de guardar tokens y navegar al home, debes navegar a la nueva pantalla de verificación de email.

### 2. Login bloqueado si no verificó el email

Si un usuario intenta hacer login sin haber verificado su email, el backend responde:

```
401 — "Please verify your email before logging in"
```

**Qué cambiar:** Detectar ese mensaje específico y navegar a la pantalla de verificación de email en lugar de mostrar "credenciales incorrectas".

---

## 🆕 Pantallas nuevas a crear

### Pantalla 1 — Verificar Email (`VerifyEmailScreen`)

Se muestra **después del registro** y también cuando el login falla por email no verificado.

**Contenido:**
- Texto: "Ingresa el código de 6 dígitos que enviamos a `{email}`"
- Campo numérico de 6 dígitos
- Botón "Verificar"
- Link/botón "Reenviar código" (con cooldown visual de 60 segundos recomendado)

**Flujo:**
1. Usuario ingresa el código → `POST /auth/verify-email`
   ```json
   { "email": "john@example.com", "code": "483920" }
   ```
2. Si `200` → guardar `accessToken` + `refreshToken` + `user`, navegar al home
3. Si `400` → mostrar "Código inválido o expirado"
4. Si toca "Reenviar" → `POST /auth/resend-verification`
   ```json
   { "email": "john@example.com" }
   ```
   Mostrar "Código reenviado" aunque la respuesta siempre sea 200

> El código expira en **15 minutos**. Pasar el email entre pantallas como parámetro de navegación.

---

### Pantalla 2 — Olvidé mi contraseña (`ForgotPasswordScreen`)

**Contenido:**
- Campo de email
- Botón "Enviar código"

**Flujo:**
1. Usuario ingresa su email → `POST /auth/forgot-password`
   ```json
   { "email": "john@example.com" }
   ```
2. Siempre responde `200` (aunque el email no exista, por seguridad)
3. Mostrar: "Si ese correo está registrado, recibirás un código"
4. Navegar a la pantalla de reset de contraseña

---

### Pantalla 3 — Resetear contraseña (`ResetPasswordScreen`)

**Contenido:**
- Campo de código (6 dígitos)
- Campo nueva contraseña
- Campo confirmar nueva contraseña
- Botón "Cambiar contraseña"

**Flujo:**
1. Validar que nueva contraseña y confirmación coincidan (en el frontend)
2. → `POST /auth/reset-password`
   ```json
   {
     "email": "john@example.com",
     "code": "483920",
     "newPassword": "NuevaPassword123"
   }
   ```
3. Si `200` → navegar al login con mensaje "Contraseña actualizada exitosamente"
4. Si `400` → mostrar "Código inválido o expirado"

**Reglas de validación de contraseña (aplicar en el frontend también):**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

---

## 🔧 Pantallas existentes a modificar

### Login Screen
- Agregar link `"¿Olvidaste tu contraseña?"` → navega a `ForgotPasswordScreen`
- Si el login falla con mensaje `"Please verify your email before logging in"` → navegar a `VerifyEmailScreen` pasando el email

### Profile Screen
- Usar `GET /comments/me` para mostrar las reseñas propias del usuario (en lugar de cualquier otra fuente)
- Respuesta incluye datos de la película (`id`, `title`, `posterUrl`) para mostrar de qué película es cada reseña:
  ```json
  [
    {
      "id": "uuid",
      "content": "Gran película",
      "score": 9,
      "movie": { "id": "uuid", "title": "Inception", "posterUrl": "https://..." }
    }
  ]
  ```

---

## 📋 Resumen de endpoints nuevos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/auth/verify-email` | No | Verificar email con código → devuelve tokens |
| `POST` | `/auth/resend-verification` | No | Reenviar código de verificación |
| `POST` | `/auth/forgot-password` | No | Solicitar código para resetear contraseña |
| `POST` | `/auth/reset-password` | No | Resetear contraseña con el código |
| `GET` | `/comments/me` | Sí | Reseñas propias del usuario (para perfil) |

---

## 🗺️ Flujo de navegación sugerido

```
Login ──────────────────────────────────────────► Home
  │
  │ "¿Olvidaste tu contraseña?"
  ▼
ForgotPassword ──► ResetPassword ──► Login (success)

Register ──► VerifyEmail ──► Home
                  │
                  │ "Reenviar código"
                  └──► (mismo VerifyEmail, nuevo código)
```

---

## Base URL

```
https://rotten-tomatoes-app-back-production.up.railway.app
```

Swagger (todos los endpoints con ejemplos): https://rotten-tomatoes-app-back-production.up.railway.app/docs
