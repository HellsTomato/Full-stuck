// import { http, HttpResponse } from 'msw'
// import type { Athlete, SessionItem, Attendance, Injury, Nutrition } from '@/types'
//
// function uid() { return Math.random().toString(36).slice(2,10) }
//
// // -----------------------
// // 🧠 Основная структура моков
// // -----------------------
// export const db = {
//   athletes: [
//     {
//       id: 'a1',
//       fullName: 'Иван Иванов',
//       birthDate: '2000-04-12',
//       group: 'Юниоры',
//       phone: '+79995554433',
//       notes: 'Перспективный спортсмен',
//     },
//     {
//       id: 'a2',
//       fullName: 'Пётр Петров',
//       birthDate: '1998-08-21',
//       group: 'Старшие',
//       phone: '+79992223344',
//       notes: 'Опытный игрок',
//     },
//   ],
//
//   injuries: [
//     {
//       id: 'i1',
//       athleteId: 'a1', // 💡 совпадает с id спортсмена
//       kind: 'Растяжение мышцы бедра',
//       date: '2025-10-10',
//       status: 'Активная',
//     },
//     {
//       id: 'i2',
//       athleteId: 'a2', // 💡 совпадает с id спортсмена
//       kind: 'Ушиб колена',
//       date: '2025-09-25',
//       status: 'Закрыта',
//     },
//   ],
//
//   sessions: [] as SessionItem[],
//   attendance: [] as Attendance[],
//   nutrition: [] as Nutrition[],
//   trainers: [] as { id: string; fullName: string; email: string; password: string }[],
// }
//
// const groups = ["Юниоры", "Старшие"]
// const names = [
//   "Иван Петров","Мария Соколова","Алексей Смирнов","Анна Морозова",
//   "Дмитрий Кузнецов","Екатерина Орлова","Сергей Волков","Ольга Лебедева",
//   "Павел Федоров","Дарья Иванова","Кирилл Никитин","Яна Киселева"
// ]
//
// const today = new Date()
// const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay()+6)%7))
// function fmt(d: Date){ return d.toISOString().slice(0,10) }
//
// export function seed(){
//   if (db.athletes.length) return
//   // Athletes
//   names.forEach((n,i)=>{
//     db.athletes.push({
//       id: uid(),
//       fullName: n,
//       birthDate: `200${i}-0${(i%8)+1}-10`,
//       group: groups[i%2],
//       status: "active",
//       phone: "+7 900 000-00-00",
//       notes: i%3===0? "Перспективный спортсмен": undefined
//     })
//   })
//   // Weekly sessions for last and current week
//   for (let w=-1; w<=0; w++){
//     for (let d=0; d<7; d++){
//       const date = new Date(monday); date.setDate(monday.getDate() + d + w*7)
//       const types = ["общая", "силовая", "кардио", "отмена"]
//       const type = types[(d%types.length)]
//       const s: SessionItem = {
//         id: uid(),
//         date: fmt(date),
//         time: "18:00",
//         type,
//         load: type==="отмена"? undefined: ["низкая","средняя","высокая"][d%3],
//         notes: type==="отмена"? "Отменено по причине занятости зала": undefined,
//         group: groups[d%2],
//       }
//       db.sessions.push(s)
//     }
//   }
//   // Attendance mixed
//   db.athletes.forEach(a=>{
//     db.sessions.filter(s=>s.group===a.group).forEach(s=>{
//       const statuses: Attendance['status'][] = ["Присутствовал","Опоздал","Отсутствовал"]
//       db.attendance.push({ id: uid(), athleteId: a.id, sessionId: s.id, status: statuses[(a.id.charCodeAt(0)+s.id.charCodeAt(0))%3] })
//     })
//   })
//   // Injuries few active
//   const some = db.athletes.slice(0,3)
//   some.forEach((a,i)=>{
//     db.injuries.push({ id: uid(), athleteId: a.id, kind: ["колено","спина","плечо"][i%3], date: fmt(today), status: i%2? "Закрыта":"Активная", recommendations: "Покой 3-5 дней" })
//   })
//   // Nutrition 30 days
//   db.athletes.forEach((a, i)=>{
//     for (let d=29; d>=0; d--){
//       const date = new Date(today); date.setDate(today.getDate()-d)
//       const w = 60 + (i%10) + Math.sin(d/6)*1.5
//       db.nutrition.push({ id: uid(), athleteId: a.id, date: fmt(date), weightKg: Math.round(w*10)/10, flag: (i+d)%17===0? "Требует внимания":"ОК" })
//     }
//   })
// }
//
// export const handlers = [
//      http.post('/api/auth/register', async ({ request }) => {
//         const body = await request.json() as any
//         if (!body.fullName || !body.email || !body.password) {
//           return HttpResponse.json({ message: 'Ошибка: неполные данные' }, { status: 400 })
//         }
//         if (db.trainers.find(t => t.email === body.email)) {
//           return HttpResponse.json({ message: 'Email уже занят' }, { status: 400 })
//         }
//         const u = { id: uid(), fullName: body.fullName, email: body.email, password: body.password }
//         db.trainers.push(u)
//         return HttpResponse.json({ token: 'mock-token', user: { id: u.id, fullName: u.fullName, email: u.email } })
//       }),
//
//       http.post('/api/auth/login', async ({ request }) => {
//         const body = await request.json() as any
//         const u = db.trainers.find(t => t.email === body.email && t.password === body.password)
//         if (!u) return HttpResponse.json({ message: 'Неверный логин или пароль' }, { status: 401 })
//         return HttpResponse.json({ token: 'mock-token', user: { id: u.id, fullName: u.fullName, email: u.email } })
//       }),
//
//   http.get('/api/athletes', ({ request }) => {
//     const url = new URL(request.url)
//     const search = url.searchParams.get('search')?.toLowerCase() || ''
//     const group = url.searchParams.get('group') || ''
//     const status = url.searchParams.get('status') || ''
//     let items = db.athletes.filter(a =>
//       (!search || a.fullName.toLowerCase().includes(search)) &&
//       (!group || a.group===group) &&
//       (!status || a.status===status as any)
//     )
//     return HttpResponse.json({ items })
//   }),
//
//   http.post('/api/athletes', async ({ request }) => {
//     const data = await request.json() as Partial<Athlete>
//     if (!data.fullName || !data.birthDate || !data.group){
//       return HttpResponse.json({ message: "Ошибка: не удалось сохранить" }, { status: 400 })
//     }
//     const item: Athlete = { id: uid(), status: "active", ...data } as Athlete
//     db.athletes.push(item)
//     return HttpResponse.json(item)
//   }),
//
//   http.patch('/api/athletes/:id', async ({ params, request }) => {
//     const body = await request.json() as Partial<Athlete>
//     const i = db.athletes.findIndex(a=>a.id===params.id)
//     if (i===-1) return HttpResponse.json({ message: "Не найдено" }, { status: 404 })
//     db.athletes[i] = { ...db.athletes[i], ...body }
//     return HttpResponse.json(db.athletes[i])
//   }),
//
//   http.get('/api/weekly-plan', ({ request }) => {
//     const url = new URL(request.url)
//     const weekStart = url.searchParams.get('weekStart')!
//     const group = url.searchParams.get('group') || ''
//     const start = new Date(weekStart)
//     const end = new Date(weekStart); end.setDate(start.getDate()+6)
//     function inWeek(d: string){
//       const dd = new Date(d)
//       return dd >= start && dd <= end
//     }
//     let items = db.sessions.filter(s => inWeek(s.date) && (!group || s.group===group))
//     return HttpResponse.json({ items })
//   }),
//
//   http.post('/api/weekly-plan/copy', async ({ request }) => {
//     const body = await request.json() as { fromWeek: string; toWeek: string; group?: string; overwrite?: boolean }
//     const startFrom = new Date(body.fromWeek)
//     const startTo = new Date(body.toWeek)
//     const endFrom = new Date(startFrom); endFrom.setDate(startFrom.getDate()+6)
//
//     function inFromWeek(d: string){
//       const dd = new Date(d); return dd >= startFrom && dd <= endFrom
//     }
//     // target week range
//     const endTo = new Date(startTo); endTo.setDate(startTo.getDate()+6)
//     function inToWeek(d: string){
//       const dd = new Date(d); return dd >= startTo && dd <= endTo
//     }
//
//     const src = db.sessions.filter(s => inFromWeek(s.date) && (!body.group || s.group===body.group) && s.type !== "отмена")
//     if (body.overwrite){
//       // remove existing target items
//       for (let i=db.sessions.length-1; i>=0; i--){
//         if (inToWeek(db.sessions[i].date) && (!body.group || db.sessions[i].group===body.group)){
//           db.sessions.splice(i,1)
//         }
//       }
//     }
//     // copy with shifted dates
//     const shiftDays = Math.round((+startTo - +startFrom)/86400000)
//     const created: SessionItem[] = []
//     src.forEach(s=>{
//       const d = new Date(s.date); d.setDate(d.getDate()+shiftDays)
//       const item: SessionItem = { ...s, id: uid(), date: d.toISOString().slice(0,10) }
//       db.sessions.push(item); created.push(item)
//     })
//     return HttpResponse.json({ items: created })
//   }),
//
//   http.get('/api/attendance', ({ request }) => {
//     const url = new URL(request.url)
//     const date = url.searchParams.get('date') || ''
//     const group = url.searchParams.get('group') || ''
//     // find sessions by date/group
//     const sessions = db.sessions.filter(s => (!date || s.date===date) && (!group || s.group===group))
//     const items = db.attendance.filter(a => sessions.some(s => s.id===a.sessionId))
//     return HttpResponse.json({ items })
//   }),
//
//   http.post('/api/attendance/bulk', async ({ request }) => {
//     const body = await request.json() as { date: string; group?: string; items: { athleteId: string; sessionId: string; status: Attendance['status'] }[] }
//     // one статус per спортсмен per session
//     for (const it of body.items){
//       const idx = db.attendance.findIndex(a => a.athleteId===it.athleteId && a.sessionId===it.sessionId)
//       if (idx>=0) db.attendance[idx].status = it.status
//       else db.attendance.push({ id: uid(), ...it })
//     }
//     const sessions = db.sessions.filter(s => s.date===body.date && (!body.group || s.group===body.group))
//     const items = db.attendance.filter(a => sessions.some(s=>s.id===a.sessionId))
//     return HttpResponse.json({ items })
//   }),
//
//   http.get('/api/injuries', ({ request }) => {
//     const url = new URL(request.url)
//     const status = url.searchParams.get('status') || ''
//     const items = db.injuries.filter(i => !status || i.status===status)
//     return HttpResponse.json({ items })
//   }),
//
//   http.post('/api/injuries', async ({ request }) => {
//     const body = await request.json() as Partial<Injury>
//     if (!body.athleteId || !body.kind || !body.date) return HttpResponse.json({ message: "Ошибка: не удалось сохранить" }, { status: 400 })
//     const item: Injury = { id: uid(), status: "Активная", ...body } as Injury
//     db.injuries.push(item)
//     return HttpResponse.json(item)
//   }),
//
//   http.patch('/api/injuries/:id', async ({ params, request }) => {
//     const body = await request.json() as Partial<Injury>
//     const idx = db.injuries.findIndex(i => i.id===params.id)
//     if (idx===-1) return HttpResponse.json({ message: "Не найдено" }, { status: 404 })
//     db.injuries[idx] = { ...db.injuries[idx], ...body }
//     return HttpResponse.json(db.injuries[idx])
//   }),
//
//   http.get('/api/nutrition', ({ request }) => {
//     const url = new URL(request.url)
//     const athleteId = url.searchParams.get('athleteId') || ''
//     const from = url.searchParams.get('from') || ''
//     const to = url.searchParams.get('to') || ''
//     let items = db.nutrition.filter(n => (!athleteId || n.athleteId===athleteId))
//     if (from) items = items.filter(n => n.date >= from)
//     if (to) items = items.filter(n => n.date <= to)
//     return HttpResponse.json({ items })
//   }),
//
//   http.post('/api/reports', async ({ request }) => {
//     const body = await request.json() as { type: string; params: any }
//     // Generate a CSV data URL as mock "download"
//     const rows = [
//       ["type", body.type],
//       ["generatedAt", new Date().toISOString()],
//       ["filter", JSON.stringify(body.params)]
//     ]
//     const csv = rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n")
//     const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
//     return HttpResponse.json({ url })
//   }),
// ]
//
// export function getActiveInjuries(){
//   return db.injuries.filter(i=>i.status==="Активная")
// }
//
