import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Palette, Bell, Shield, Mail, Globe, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getConfiguracion, updateConfiguracion, createConfiguracion } from '@/api/administracion'
import { apiErrorMessage } from '@/lib/formUtils'
import {
  ACCENT_OPTIONS,
  applyAccentColor,
  applyDarkMode,
  applyDensity,
  getStoredTheme,
} from '@/lib/theme'
import { useT } from '@/hooks/useT'
import { useLanguageStore } from '@/store/languageStore'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'general', labelKey: 'General', icon: Globe },
  { id: 'apariencia', labelKey: 'Apariencia', icon: Palette },
  { id: 'notificaciones', labelKey: 'Notificaciones', icon: Bell },
  { id: 'seguridad', labelKey: 'Seguridad', icon: Shield },
  { id: 'correo', labelKey: 'Correo', icon: Mail },
]

const DEFAULTS = {
  sistema_nombre: 'SmashIACodeR',
  sistema_logo: '',
  zona_horaria: 'America/Guayaquil',
  idioma: 'es',
  moneda: 'USD',
  alerta_stock_bajo: 'true',
  umbral_alerta: '10',
  notificaciones_email: 'false',
  tiempo_sesion: '8h',
  intentos_login_max: '5',
  email_host: 'smtp.gmail.com',
  email_port: '587',
  email_user: '',
  email_password: '',
  email_tls: 'true',
}

function configsToMap(configs) {
  const map = { ...DEFAULTS }
  for (const row of configs) {
    if (row.clave) map[row.clave] = row.valor ?? ''
  }
  return map
}

async function upsertConfig(clave, valor, descripcion = '') {
  try {
    return await updateConfiguracion(clave, valor)
  } catch (err) {
    if (err.response?.status === 404) {
      return await createConfiguracion({ clave, valor, descripcion })
    }
    throw err
  }
}

function FieldRow({ label, children, hint, compact }) {
  return (
    <div className={cn('grid gap-2', !compact && 'sm:grid-cols-[200px_1fr] sm:items-center sm:gap-4')}>
      <div>
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function SelectField({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export default function ConfiguracionPanel({ compact = false }) {
  const { t, language } = useT()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)

  const [general, setGeneral] = useState({
    sistema_nombre: DEFAULTS.sistema_nombre,
    sistema_logo: DEFAULTS.sistema_logo,
    zona_horaria: DEFAULTS.zona_horaria,
    idioma: language,
    moneda: DEFAULTS.moneda,
  })

  const [apariencia, setApariencia] = useState(() => {
    const stored = getStoredTheme()
    return {
      mode: stored.mode ?? 'light',
      accent: stored.accent ?? 'zinc',
      density: stored.density ?? 'normal',
    }
  })

  const [notificaciones, setNotificaciones] = useState({
    alerta_stock_bajo: DEFAULTS.alerta_stock_bajo,
    umbral_alerta: DEFAULTS.umbral_alerta,
    notificaciones_email: DEFAULTS.notificaciones_email,
  })

  const [seguridad, setSeguridad] = useState({
    tiempo_sesion: DEFAULTS.tiempo_sesion,
    intentos_login_max: DEFAULTS.intentos_login_max,
  })

  const [correo, setCorreo] = useState({
    email_host: DEFAULTS.email_host,
    email_port: DEFAULTS.email_port,
    email_user: DEFAULTS.email_user,
    email_password: DEFAULTS.email_password,
    email_tls: DEFAULTS.email_tls,
  })

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const res = await getConfiguracion()
      return res.data.data ?? []
    },
  })

  useEffect(() => {
    if (!configs.length) return
    const map = configsToMap(configs)
    setGeneral({
      sistema_nombre: map.sistema_nombre,
      sistema_logo: map.sistema_logo,
      zona_horaria: map.zona_horaria,
      idioma: language || map.idioma,
      moneda: map.moneda,
    })
    setNotificaciones({
      alerta_stock_bajo: map.alerta_stock_bajo,
      umbral_alerta: map.umbral_alerta,
      notificaciones_email: map.notificaciones_email,
    })
    setSeguridad({
      tiempo_sesion: map.tiempo_sesion,
      intentos_login_max: map.intentos_login_max,
    })
    setCorreo({
      email_host: map.email_host,
      email_port: map.email_port,
      email_user: map.email_user,
      email_password: map.email_password,
      email_tls: map.email_tls,
    })
  }, [configs, language])

  async function saveSection(entries, sectionLabel) {
    setSaving(true)
    try {
      for (const [clave, valor] of Object.entries(entries)) {
        await upsertConfig(clave, String(valor))
      }
      toast.success(`${sectionLabel}: cambios guardados`)
      queryClient.invalidateQueries({ queryKey: ['configuracion'] })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al guardar la configuración'))
    } finally {
      setSaving(false)
    }
  }

  function handleModeChange(mode) {
    setApariencia((s) => ({ ...s, mode }))
    applyDarkMode(mode)
    toast.success('Tema aplicado')
  }

  function handleAccentChange(accent) {
    setApariencia((s) => ({ ...s, accent }))
    applyAccentColor(accent)
    toast.success('Color de acento aplicado')
  }

  function handleDensityChange(density) {
    setApariencia((s) => ({ ...s, density }))
    applyDensity(density)
    toast.success('Densidad aplicada')
  }

  function handleLanguageChange(idioma) {
    setGeneral((s) => ({ ...s, idioma }))
    setLanguage(idioma)
    toast.success(idioma === 'en' ? 'Language changed to English' : 'Idioma cambiado a Español')
  }

  useEffect(() => {
    setGeneral((s) => ({ ...s, idioma: language }))
  }, [language])

  function saveApariencia() {
    applyDarkMode(apariencia.mode)
    applyAccentColor(apariencia.accent)
    applyDensity(apariencia.density)
    toast.success('Apariencia: cambios guardados')
  }

  if (isLoading) return <LoadingSpinner className="min-h-[200px]" />

  const tabContent = (
    <>
      {activeTab === 'general' && (
        <Card className="border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-zinc-100">
              <Globe size={18} /> {t('General')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow compact={compact} label="Nombre del sistema">
              <Input value={general.sistema_nombre} onChange={(e) => setGeneral((s) => ({ ...s, sistema_nombre: e.target.value }))} />
            </FieldRow>
            <FieldRow compact={compact} label="URL del logo">
              <Input value={general.sistema_logo} onChange={(e) => setGeneral((s) => ({ ...s, sistema_logo: e.target.value }))} placeholder="https://..." />
            </FieldRow>
            <FieldRow compact={compact} label="Zona horaria">
              <SelectField value={general.zona_horaria} onChange={(e) => setGeneral((s) => ({ ...s, zona_horaria: e.target.value }))}
                options={[
                  { value: 'America/Guayaquil', label: 'Ecuador (Guayaquil)' },
                  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
                  { value: 'America/Mexico_City', label: 'México' },
                  { value: 'UTC', label: 'UTC' },
                ]}
              />
            </FieldRow>
            <FieldRow compact={compact} label={t('Idioma')}>
              <SelectField value={language} onChange={(e) => handleLanguageChange(e.target.value)}
                options={[
                  { value: 'es', label: '🇪🇸 Español' },
                  { value: 'en', label: '🇬🇧 English' },
                ]}
              />
            </FieldRow>
            <FieldRow compact={compact} label="Moneda">
              <SelectField value={general.moneda} onChange={(e) => setGeneral((s) => ({ ...s, moneda: e.target.value }))}
                options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
              />
            </FieldRow>
            <div className="flex justify-end border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <Button loading={saving} onClick={() => saveSection(general, t('General'))}><Save size={15} /> {t('Guardar')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'apariencia' && (
        <Card className="border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-zinc-100">
              <Palette size={18} /> {t('Apariencia')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow compact={compact} label="Modo de color">
              <SelectField value={apariencia.mode} onChange={(e) => handleModeChange(e.target.value)}
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'system', label: 'Sistema' },
                ]}
              />
            </FieldRow>
            <FieldRow compact={compact} label={t('Color de acento')}>
              <div className="flex flex-wrap gap-2">
                {ACCENT_OPTIONS.map(({ id, label, swatch }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    onClick={() => handleAccentChange(id)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all duration-200',
                      'hover:scale-110 active:scale-95',
                      apariencia.accent === id
                        ? 'scale-110 border-zinc-900 shadow-lg dark:border-white'
                        : 'border-transparent',
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </FieldRow>
            <FieldRow compact={compact} label="Densidad">
              <SelectField value={apariencia.density} onChange={(e) => handleDensityChange(e.target.value)}
                options={[
                  { value: 'compact', label: 'Compacta' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'spacious', label: 'Espaciada' },
                ]}
              />
            </FieldRow>
            <div className="flex justify-end border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <Button onClick={saveApariencia}><Save size={15} /> {t('Guardar')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notificaciones' && (
        <Card className="border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-zinc-100">
              <Bell size={18} /> Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow compact={compact} label="Alertas stock bajo">
              <SelectField value={notificaciones.alerta_stock_bajo} onChange={(e) => setNotificaciones((s) => ({ ...s, alerta_stock_bajo: e.target.value }))}
                options={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
              />
            </FieldRow>
            <FieldRow compact={compact} label="Umbral de alerta">
              <Input type="number" min={0} value={notificaciones.umbral_alerta}
                onChange={(e) => setNotificaciones((s) => ({ ...s, umbral_alerta: e.target.value }))} className="max-w-xs" />
            </FieldRow>
            <FieldRow compact={compact} label="Email">
              <SelectField value={notificaciones.notificaciones_email} onChange={(e) => setNotificaciones((s) => ({ ...s, notificaciones_email: e.target.value }))}
                options={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
              />
            </FieldRow>
            <div className="flex justify-end border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <Button loading={saving} onClick={() => saveSection(notificaciones, 'Notificaciones')}><Save size={15} /> Guardar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'seguridad' && (
        <Card className="border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-zinc-100">
              <Shield size={18} /> Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow compact={compact} label="Tiempo de sesión">
              <SelectField value={seguridad.tiempo_sesion} onChange={(e) => setSeguridad((s) => ({ ...s, tiempo_sesion: e.target.value }))}
                options={[
                  { value: '1h', label: '1 hora' },
                  { value: '4h', label: '4 horas' },
                  { value: '8h', label: '8 horas' },
                  { value: '24h', label: '24 horas' },
                ]}
              />
            </FieldRow>
            <FieldRow compact={compact} label="Intentos login">
              <Input type="number" min={1} max={20} value={seguridad.intentos_login_max}
                onChange={(e) => setSeguridad((s) => ({ ...s, intentos_login_max: e.target.value }))} className="max-w-xs" />
            </FieldRow>
            <div className="flex justify-end border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <Button loading={saving} onClick={() => saveSection(seguridad, 'Seguridad')}><Save size={15} /> Guardar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'correo' && (
        <Card className="border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-zinc-100">
              <Mail size={18} /> Correo SMTP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow compact={compact} label="Host SMTP">
              <Input value={correo.email_host} onChange={(e) => setCorreo((s) => ({ ...s, email_host: e.target.value }))} />
            </FieldRow>
            <FieldRow compact={compact} label="Puerto">
              <Input type="number" value={correo.email_port} onChange={(e) => setCorreo((s) => ({ ...s, email_port: e.target.value }))} className="max-w-xs" />
            </FieldRow>
            <FieldRow compact={compact} label="Usuario">
              <Input type="email" value={correo.email_user} onChange={(e) => setCorreo((s) => ({ ...s, email_user: e.target.value }))} />
            </FieldRow>
            <FieldRow compact={compact} label="Contraseña">
              <Input type="password" value={correo.email_password} onChange={(e) => setCorreo((s) => ({ ...s, email_password: e.target.value }))} placeholder="••••••••" />
            </FieldRow>
            <FieldRow compact={compact} label="TLS">
              <SelectField value={correo.email_tls} onChange={(e) => setCorreo((s) => ({ ...s, email_tls: e.target.value }))}
                options={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
              />
            </FieldRow>
            <div className="flex justify-end border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <Button loading={saving} onClick={() => saveSection(correo, 'Correo')}><Save size={15} /> Guardar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )

  return (
    <div className={cn('flex flex-col gap-4', !compact && 'lg:flex-row lg:gap-6')}>
      <nav className={cn(
        'flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-zinc-100 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900',
        compact ? 'flex-row' : 'flex-row lg:w-56 lg:flex-col',
      )}>
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === id
                ? 'text-white'
                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800',
            )}
            style={activeTab === id
              ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }
              : undefined}
          >
            <Icon size={15} />
            {t(labelKey)}
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1">{tabContent}</div>
    </div>
  )
}
