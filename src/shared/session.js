import { useSyncExternalStore } from 'react'
import { db } from './db.js'

/**
 * 会话（当前登录用户）：属于「账号与权限」模块对外暴露的公共能力。
 * 其他模块只调用 useSession()，不要自己写 localStorage。
 */

const STORAGE_KEY = 'campus-events:session:v1'
const listeners = new Set()

let currentUserId = null
try {
  currentUserId = localStorage.getItem(STORAGE_KEY)
} catch {
  currentUserId = null
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  listeners.forEach((fn) => fn())
}

export const session = {
  getUserId() {
    return currentUserId
  },
  getUser() {
    return currentUserId ? db.find('users', currentUserId) : null
  },
  login(userId) {
    currentUserId = userId
    localStorage.setItem(STORAGE_KEY, userId)
    emit()
  },
  logout() {
    currentUserId = null
    localStorage.removeItem(STORAGE_KEY)
    emit()
  },
  isRole(role) {
    return session.getUser()?.role === role
  },
}

export function useSession() {
  const userId = useSyncExternalStore(subscribe, () => currentUserId)
  return {
    userId,
    user: userId ? db.find('users', userId) : null,
    login: session.login,
    logout: session.logout,
  }
}
