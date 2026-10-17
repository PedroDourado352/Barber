// Gerador de identificadores simples e únicos o suficiente para uso local.
// Quando migrar para o Firebase, os ids passam a vir do Firestore (doc.id).
export function createId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${prefix}_${time}${random}`
}
