// =============================================================================
// ChronoSync — All Academic Tasks & Assignments Portal (DeadlinesFeed.jsx)
// =============================================================================
// Displays all tasks (Pending, Completed, Not Completed, Imminent) scoped to the
// student's enrolled program and department with direct assignment document downloads.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { deadlineAPI, courseAPI } from '../services/api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import {
  Search, RefreshCw, Layers, Zap, Database, CheckCircle2,
  Clock, FileText, Download, Filter, BookOpen, AlertCircle, Sparkles
} from 'lucide-react';

export default function DeadlinesFeed() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED' | 'DOWNLOADS'
  const [searchQuery, setSearchQuery] = useState('');
  const [cacheSource, setCacheSource] = useState('database');
  const [isLoading, setIsLoading] = useState(true);

  // Load courses and deadlines
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, deadlinesRes] = await Promise.all([
        courseAPI.getAll(),
        deadlineAPI.getAll({
          course_id: selectedCourse || undefined,
          urgency: selectedUrgency || undefined,
        }),
      ]);
      setCourses(coursesRes.data.courses || []);
      setDeadlines(deadlinesRes.data.deadlines || []);
      setCacheSource(deadlinesRes.data.source || 'database');
    } catch (err) {
      console.error('Error fetching tasks feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedUrgency]);

  // ACID Submission Toggle
  const handleToggleStatus = async (deadlineId, newStatus) => {
    try {
      await deadlineAPI.toggle(deadlineId, newStatus);
      setDeadlines(prev =>
        prev.map(dl =>
          dl.deadline_id === deadlineId
            ? { ...dl, submission_status: newStatus }
            : dl
        )
      );
    } catch (err) {
      console.error('Failed to toggle submission status:', err);
    }
  };

  // Faculty/HOD Delete assignment from active dashboards
  const handleDelete = async (deadlineId) => {
    if (!window.confirm('Delete this assignment? It will be automatically removed from all Student and CR dashboards immediately, while remaining permanently archived in your History page as proof of work.')) return;
    try {
      await deadlineAPI.delete(deadlineId);
      setDeadlines(prev => prev.filter(dl => dl.deadline_id !== deadlineId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete assignment.');
    }
  };

  const isFacultyOrHOD = user?.role_id === 3 || user?.role_id === 4;

  // Real-time KPI Counts
  const counts = useMemo(() => {
    const total = deadlines.length;
    const completed = deadlines.filter(d => d.submission_status === 'DONE').length;
    const pending = total - completed;
    const withDownloads = deadlines.filter(d => Boolean(d.pdf_blob_url)).length;
    return { total, pending, completed, withDownloads };
  }, [deadlines]);

  // Multi-facet filtering
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter(dl => {
      // 1. Status Filter
      if (statusFilter === 'PENDING' && dl.submission_status === 'DONE') return false;
      if (statusFilter === 'COMPLETED' && dl.submission_status !== 'DONE') return false;
      if (statusFilter === 'DOWNLOADS' && !dl.pdf_blob_url) return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const text = `${dl.title} ${dl.course_code} ${dl.course_name} ${dl.description || ''} ${dl.posted_by_name || ''} ${dl.program || ''}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }

      return true;
    });
  }, [deadlines, statusFilter, searchQuery]);

  return (
    <div>
      <Navbar
        title="All Academic Tasks & Assignments"
        subtitle={`Live deliverable queue synced for ${user?.program || 'All Programs'} · ${user?.department || 'Department'}`}
      />

      {/* Top Status & Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {/* Total Deliverables */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
            background: statusFilter === 'ALL' ? 'rgba(245, 78, 0, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TOTAL TASKS</span>
            <BookOpen size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {counts.total}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Enrolled program catalog
          </div>
        </div>

        {/* Pending / Not Completed */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'PENDING' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
            background: statusFilter === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>PENDING QUEUE</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#f59e0b', marginTop: '4px' }}>
            {counts.pending}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Unsubmitted deliverables
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'COMPLETED' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
            background: statusFilter === 'COMPLETED' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>COMPLETED</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#10b981', marginTop: '4px' }}>
            {counts.completed}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            ACID audit-logged done
          </div>
        </div>

        {/* Downloadable Files */}
        <div
          onClick={() => setStatusFilter('DOWNLOADS')}
          className="glass-card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: statusFilter === 'DOWNLOADS' ? '1px solid #14b8a6' : '1px solid var(--border-subtle)',
            background: statusFilter === 'DOWNLOADS' ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ATTACHED FILES</span>
            <Download size={16} color="#14b8a6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#14b8a6', marginTop: '4px' }}>
            {counts.withDownloads}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Downloadable assignments & docs
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Status Tabs */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        {/* Status Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="btn btn-sm"
            style={{
              background: statusFilter === 'ALL' ? 'var(--primary)' : 'var(--bg-secondary)',
              color: statusFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: statusFilter === 'ALL' ? 'var(--primary)' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>All Tasks</span>
            <span style={{
              background: statusFilter === 'ALL' ? 'rgba(255,255,255,0.25)' : 'var(--bg-tertiary)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '10.5px'
            }}>
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className="btn btn-sm"
            style={{
              background: statusFilter === 'PENDING' ? '#f59e0b' : 'var(--bg-secondary)',
              color: statusFilter === 'PENDING' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: statusFilter === 'PENDING' ? '#f59e0b' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={13} />
            <span>Pending (Incomplete)</span>
            <span style={{
              background: statusFilter === 'PENDING' ? 'rgba(255,255,255,0.25)' : 'var(--bg-tertiary)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '10.5px'
            }}>
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className="btn btn-sm"
            style={{
              background: statusFilter === 'COMPLETED' ? '#10b981' : 'var(--bg-secondary)',
              color: statusFilter === 'COMPLETED' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: statusFilter === 'COMPLETED' ? '#10b981' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={13} />
            <span>Completed</span>
            <span style={{
              background: statusFilter === 'COMPLETED' ? 'rgba(255,255,255,0.25)' : 'var(--bg-tertiary)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '10.5px'
            }}>
              {counts.completed}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('DOWNLOADS')}
            className="btn btn-sm"
            style={{
              background: statusFilter === 'DOWNLOADS' ? '#14b8a6' : 'var(--bg-secondary)',
              color: statusFilter === 'DOWNLOADS' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: statusFilter === 'DOWNLOADS' ? '#14b8a6' : 'var(--border-subtle)',
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={13} />
            <span>With Downloadable Files</span>
            <span style={{
              background: statusFilter === 'DOWNLOADS' ? 'rgba(255,255,255,0.25)' : 'var(--bg-tertiary)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '10.5px'
            }}>
              {counts.withDownloads}
            </span>
          </button>
        </div>

        {/* Search & Dropdown Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1fr auto',
          gap: '12px',
          alignItems: 'center',
        }}>
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              placeholder="Search assignments, topics, course codes, CR or faculty..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Subject Filter */}
          <select
            className="input-field"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">All Subjects & Courses</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code}: {c.course_name}
              </option>
            ))}
          </select>

          {/* Urgency Filter */}
          <select
            className="input-field"
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
          >
            <option value="">All Urgency Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            className="btn btn-secondary"
            title="Refresh feed"
            style={{ width: '40px', padding: 0 }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* System Design Cache & Telemetry Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11.5px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={13} style={{ color: 'var(--primary)' }} />
            <span>Showing: <strong style={{ color: 'var(--text-primary)' }}>{filteredDeadlines.length}</strong> of {counts.total} tasks</span>
            <span>·</span>
            <span>Program Scope: <strong style={{ color: 'var(--text-secondary)' }}>{user?.program || 'All'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Telemetry:</span>
            {cacheSource === 'cache' ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--semantic-success)',
                fontWeight: 600,
              }}>
                <Zap size={12} />
                <span>O(1) Memory Cache Hit</span>
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--primary)',
                fontWeight: 600,
              }}>
                <Database size={12} />
                <span>Azure SQL Relational Feed</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deadlines Grid */}
      {filteredDeadlines.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--primary)' }} />
          <p style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
            No deliverables match current filters
          </p>
          <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px' }}>
            {statusFilter === 'COMPLETED'
              ? 'You have not marked any deliverables as completed yet. Toggle tasks to completed as you finish them!'
              : statusFilter === 'PENDING'
                ? 'Congratulations! You have completed all deliverables in this queue!'
                : statusFilter === 'DOWNLOADS'
                  ? 'No assignments in this program have downloadable document attachments attached yet.'
                  : 'Try clearing the search query or adjusting filter parameters.'}
          </p>
          {(statusFilter !== 'ALL' || searchQuery || selectedCourse || selectedUrgency) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
                setSelectedCourse('');
                setSelectedUrgency('');
              }}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '16px',
        }}>
          {filteredDeadlines.map((dl) => (
            <TaskCard
              key={dl.deadline_id}
              deadline={dl}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              canDelete={isFacultyOrHOD}
            />
          ))}
        </div>
      )}
    </div>
  );
}
