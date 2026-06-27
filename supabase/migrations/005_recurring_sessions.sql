alter table sessions
  add column recurrence text not null default 'none'
    check (recurrence in ('none', 'weekly', 'mwf', 'daily')),
  add column recurrence_end date;
