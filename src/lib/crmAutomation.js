/**
 * CRM Automation Engine
 * Handles auto-reminders, follow-up sequences, and stage-based triggers.
 */

// Default automation rules
export const DEFAULT_RULES = [
  {
    id: 'after_call_followup',
    name: 'Follow-up after phone call',
    trigger: 'interaction',
    triggerType: 'call',
    action: 'create_reminder',
    delayDays: 3,
    reminderType: 'follow_up',
    reminderNote: 'Auto: Follow up 3 days after phone call',
    active: true,
  },
  {
    id: 'after_visit_followup',
    name: 'Follow-up after store visit',
    trigger: 'interaction',
    triggerType: 'visit',
    action: 'create_reminder',
    delayDays: 1,
    reminderType: 'follow_up',
    reminderNote: 'Auto: Follow up day after store visit',
    active: true,
  },
  {
    id: 'new_lead_contact',
    name: 'Contact new lead within 24hrs',
    trigger: 'new_lead',
    action: 'create_reminder',
    delayDays: 0,
    reminderType: 'callback',
    reminderNote: 'Auto: New lead — make initial contact today',
    active: true,
  },
  {
    id: 'quoted_followup',
    name: 'Follow up after quoting',
    trigger: 'stage_change',
    triggerStage: 'quoted',
    action: 'create_reminder',
    delayDays: 2,
    reminderType: 'follow_up',
    reminderNote: 'Auto: Follow up 2 days after quoting',
    active: true,
  },
  {
    id: 'appt_set_reminder',
    name: 'Reminder before appointment',
    trigger: 'stage_change',
    triggerStage: 'appt_set',
    action: 'create_reminder',
    delayDays: 0,
    reminderType: 'appointment',
    reminderNote: 'Auto: Appointment set — confirm day before',
    active: true,
  },
  {
    id: 'no_activity_7d',
    name: 'No activity in 7 days',
    trigger: 'inactivity',
    inactivityDays: 7,
    action: 'create_reminder',
    delayDays: 0,
    reminderType: 'follow_up',
    reminderNote: 'Auto: No activity for 7 days — re-engage customer',
    active: true,
  },
];

// Default follow-up sequences
export const DEFAULT_SEQUENCES = [
  {
    id: 'new_internet_lead',
    name: 'New Internet Lead',
    description: 'Standard follow-up for website/Facebook leads',
    steps: [
      { day: 0, action: 'call', note: 'Initial call — introduce yourself, confirm interest' },
      { day: 0, action: 'text', note: 'Send intro text if no answer' },
      { day: 1, action: 'call', note: 'Second attempt — leave voicemail if no answer' },
      { day: 2, action: 'email', note: 'Send email with unit details and current promo' },
      { day: 4, action: 'call', note: 'Third call attempt' },
      { day: 7, action: 'text', note: 'Check-in text — still interested?' },
      { day: 14, action: 'call', note: 'Final follow-up attempt' },
    ],
  },
  {
    id: 'new_floor_lead',
    name: 'New Floor Lead',
    description: 'Follow-up after walk-in or phone inquiry',
    steps: [
      { day: 1, action: 'call', note: 'Thank you call — answer any questions from visit' },
      { day: 3, action: 'text', note: 'Check in — any questions about the unit?' },
      { day: 7, action: 'call', note: 'Follow up — ready to move forward?' },
    ],
  },
  {
    id: 'post_quote',
    name: 'After Quote Sent',
    description: 'Follow-up after providing a price quote',
    steps: [
      { day: 1, action: 'call', note: 'Check if quote was received, answer questions' },
      { day: 3, action: 'text', note: 'Any thoughts on the numbers?' },
      { day: 5, action: 'call', note: 'Follow up — what would it take to earn your business?' },
      { day: 10, action: 'call', note: 'Final check before archiving' },
    ],
  },
];

/**
 * Process a new interaction and return any auto-reminders to create.
 */
export function processInteraction(rules, interactionType, customer) {
  const reminders = [];
  const activeRules = (rules || DEFAULT_RULES).filter((r) => r.active && r.trigger === 'interaction' && r.triggerType === interactionType);

  for (const rule of activeRules) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (rule.delayDays || 0));
    reminders.push({
      customer_id: customer.id,
      user_id: customer.assigned_to,
      due_date: dueDate.toISOString().split('T')[0],
      reminder_type: rule.reminderType || 'follow_up',
      notes: rule.reminderNote || `Auto: Follow up after ${interactionType}`,
    });
  }
  return reminders;
}

/**
 * Process a stage change and return any auto-reminders to create.
 */
export function processStageChange(rules, newStage, customer) {
  const reminders = [];
  const activeRules = (rules || DEFAULT_RULES).filter((r) => r.active && r.trigger === 'stage_change' && r.triggerStage === newStage);

  for (const rule of activeRules) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (rule.delayDays || 0));
    reminders.push({
      customer_id: customer.id,
      user_id: customer.assigned_to,
      due_date: dueDate.toISOString().split('T')[0],
      reminder_type: rule.reminderType || 'follow_up',
      notes: rule.reminderNote || `Auto: Stage changed to ${newStage}`,
    });
  }
  return reminders;
}

/**
 * Process new lead creation and return any auto-reminders.
 */
export function processNewLead(rules, customer) {
  const reminders = [];
  const activeRules = (rules || DEFAULT_RULES).filter((r) => r.active && r.trigger === 'new_lead');

  for (const rule of activeRules) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (rule.delayDays || 0));
    reminders.push({
      customer_id: customer.id,
      user_id: customer.assigned_to,
      due_date: dueDate.toISOString().split('T')[0],
      reminder_type: rule.reminderType || 'callback',
      notes: rule.reminderNote || 'Auto: New lead — make contact',
    });
  }
  return reminders;
}

/**
 * Get the next step in a follow-up sequence for a customer.
 */
export function getNextSequenceStep(sequence, completedSteps) {
  const done = completedSteps || 0;
  if (done >= sequence.steps.length) return null;
  return { stepIndex: done, ...sequence.steps[done] };
}
