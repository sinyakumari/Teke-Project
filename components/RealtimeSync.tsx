'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

export function RealtimeSync() {
  const store = useAppStore()
  
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to all changes in the public schema
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainings' },
        (payload) => {
          console.log('[Realtime] Training change:', payload)
          if (payload.eventType === 'INSERT') {
            store.addTraining(payload.new as any)
          } else if (payload.eventType === 'UPDATE') {
            store.updateTraining(payload.new as any)
          } else if (payload.eventType === 'DELETE') {
            store.deleteTraining(payload.old.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lessons' },
        (payload) => {
          console.log('[Realtime] Lesson change:', payload)
          const data = (payload.new || payload.old) as any
          if (payload.eventType === 'INSERT') {
            store.addLesson(data.training_id, payload.new as any)
          } else if (payload.eventType === 'UPDATE') {
            store.updateLesson(data.training_id, data.id, payload.new)
          } else if (payload.eventType === 'DELETE') {
            store.deleteLesson(data.training_id, data.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('[Realtime] Task change:', payload)
          if (payload.eventType === 'INSERT') {
            // Map table column names to store property names if needed
            // Currently they mostly match or the store is flexible
            store.addTask(payload.new as any)
          } else if (payload.eventType === 'UPDATE') {
            store.updateTask(payload.new as any)
          } else if (payload.eventType === 'DELETE') {
            store.deleteTask(payload.old.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worksheets' },
        (payload) => {
          console.log('[Realtime] Worksheet change:', payload)
          const data = (payload.new || payload.old) as any
          if (payload.eventType === 'INSERT') {
            // Note: API returns slightly different structure, but we'll adapt
            store.addWorksheet(data.training_id, payload.new as any)
          } else if (payload.eventType === 'UPDATE') {
            // No direct updateWorksheet in store yet, usually done via individual questions or re-fetch
          } else if (payload.eventType === 'DELETE') {
            store.deleteWorksheet(data.training_id, data.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worksheet_questions' },
        (payload) => {
          console.log('[Realtime] Question change:', payload)
          const data = (payload.new || payload.old) as any
          if (payload.eventType === 'INSERT') {
            // Store expects Question interface { id, worksheetId, question, answer, order }
            const mapped = {
              id: data.id,
              worksheetId: data.worksheet_id,
              question: data.question_text,
              answer: data.answer_text,
              order: data.order_index
            }
            store.updateWorksheetQuestion(data.training_id, data.worksheet_id, mapped)
          } else if (payload.eventType === 'UPDATE') {
            // Update logic...
          } else if (payload.eventType === 'DELETE') {
            store.deleteWorksheetQuestion(data.training_id, data.worksheet_id, data.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'history' },
        (payload) => {
          console.log('[Realtime] Notification change:', payload)
          // Simply refresh notifications to ensure unread counts are correct
          store.fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_settings' },
        (payload) => {
          console.log('[Realtime] User Settings change:', payload)
          // Refresh user data
          store.fetchUser()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return null // This component only manages sync state, it doesn't render anything
}
