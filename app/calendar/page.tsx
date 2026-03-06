'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MOCK_APPLICATIONS } from '@/lib/mock-data';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ExternalLink,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const events = MOCK_APPLICATIONS
    .filter(app => app.upcomingEvent)
    .map(app => ({
      id: app.id,
      company: app.companyName,
      type: app.upcomingEvent!.type,
      date: new Date(app.upcomingEvent!.date),
      link: app.upcomingEvent!.meetingLink,
      prep: app.upcomingEvent!.prepNotes,
    }));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Your Schedule</h1>
          <p className="text-slate-500">Track your interviews and screening calls.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-sm font-bold text-slate-900 min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {calendarDays.map((day, i) => {
          const dayEvents = events.filter(event => isSameDay(event.date, day));
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[120px] p-2 bg-white cursor-pointer transition-colors hover:bg-slate-50 ${
                !isCurrentMonth ? 'bg-slate-50/50' : ''
              } ${isSelected ? 'ring-2 ring-inset ring-indigo-600 z-10' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-medium ${
                  !isCurrentMonth ? 'text-slate-300' : isSameDay(day, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-700'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`text-[10px] p-1.5 rounded-md border leading-tight truncate ${
                      event.type === 'Interview' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      event.type === 'Screening' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    <span className="font-bold">{event.type}</span>: {event.company}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedDayEvents = events.filter(event => isSameDay(event.date, selectedDate));

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Events for {format(selectedDate, 'MMM d, yyyy')}
            </h2>
            
            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDayEvents.map(event => (
                  <div key={event.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        event.type === 'Interview' ? 'bg-amber-100 text-amber-700' :
                        event.type === 'Screening' ? 'bg-purple-100 text-purple-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {event.type}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{format(event.date, 'h:mm a')}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-slate-900">{event.company}</h3>
                      <p className="text-xs text-slate-500">Job Application Event</p>
                    </div>

                    {event.link && (
                      <a 
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                      >
                        Join Meeting
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {event.prep && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prep Notes</p>
                        <p className="text-xs text-slate-600 italic">&quot;{event.prep}&quot;</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No events scheduled for this day.</p>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 mb-2">Quick Tip</h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Always join your meetings 5 minutes early to test your audio and video settings. Good luck!
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
