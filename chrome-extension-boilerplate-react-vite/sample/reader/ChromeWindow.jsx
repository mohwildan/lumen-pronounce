import React from 'react';

export function ChromeWindow({ tabs, activeIndex, url, width, height, children }) {
  return (
    <div style={{
      width, height, background: '#fff', borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Chrome Header */}
      <div style={{ background: '#DFE1E5', padding: '8px 8px 0', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, padding: '0 8px', marginBottom: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ED6A5E' }}/>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F4BF4F' }}/>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#61C554' }}/>
        </div>
        {/* Tabs */}
        {tabs.map((tab, i) => (
          <div key={i} style={{
            padding: '8px 16px', background: i === activeIndex ? '#fff' : 'transparent',
            borderRadius: '8px 8px 0 0', fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            color: i === activeIndex ? '#333' : '#5f6368', flex: i === activeIndex ? 1 : 'none',
            maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: i === activeIndex ? '#eee' : 'transparent' }}/>
            {tab.title}
          </div>
        ))}
      </div>
      {/* URL Bar */}
      <div style={{ background: '#fff', padding: '8px', borderBottom: '1px solid #ddd', display: 'flex' }}>
        <div style={{
          flex: 1, background: '#F1F3F4', borderRadius: 16, padding: '6px 16px',
          fontSize: 13, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#3c4043'
        }}>
          {url}
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
