import React, { useState, useCallback, useEffect } from 'react';
import { AppTab } from '@/constants';
import { syncGmailEmails } from '@/services';
import { useJobApplications, useSettings } from '@/hooks';
import {
  Sidebar,
  AssistantView,
  JobDashboard,
  ResumeValidator,
  SettingsView
} from '@/components';

/**
 * OAuth Callback Handler Component
 */
function OAuthCallback({ onSuccess, onError }) {
  useEffect(() => {
    // Parse the hash fragment for OAuth token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (accessToken) {
      onSuccess(accessToken);
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    } else if (error) {
      onError(error);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [onSuccess, onError]);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Processing Gmail authorization...</p>
      </div>
    </div>
  );
}

/**
 * Main Application Component
 * Orchestrates all views and manages global state
 */
function App() {
  const [activeTab, setActiveTab] = useState(AppTab.ASSISTANT);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);

  // Check if this is an OAuth callback
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('/oauth/callback') || hash.includes('access_token')) {
      setIsOAuthCallback(true);
    }
  }, []);

  // Custom hooks for state management
  const {
    applications,
    applicationsRef,
    saveJobApplication,
    deleteJobApplication,
    updateJobStatus,
    listJobs,
    findJobByCompany,
    clearAllJobs
  } = useJobApplications();

  const { settings, settingsRef, updateSettings } = useSettings();

  // OAuth success handler
  const handleOAuthSuccess = useCallback((accessToken) => {
    updateSettings({
      ...settingsRef.current,
      isGmailConnected: true,
      gmailAccessToken: accessToken
    });
    setIsOAuthCallback(false);
    setActiveTab(AppTab.SETTINGS);
  }, [updateSettings, settingsRef]);

  // OAuth error handler
  const handleOAuthError = useCallback((error) => {
    console.error('OAuth error:', error);
    alert('Gmail connection failed: ' + error);
    setIsOAuthCallback(false);
    setActiveTab(AppTab.SETTINGS);
  }, []);

  // Gmail sync handler
  const handleSyncGmail = useCallback(async () => {
    if (!settings.isGmailConnected || isSyncingGmail) return;
    setIsSyncingGmail(true);

    try {
      const result = await syncGmailEmails(settingsRef.current);

      // Execute tool calls returned by the sync process
      for (const part of result.functionCalls) {
        if (part.functionCall) {
          const fc = part.functionCall;
          if (fc.name === 'save_job_application') {
            saveJobApplication(fc.args);
          } else if (fc.name === 'update_job_status') {
            updateJobStatus(fc.args.company, fc.args.status);
          }
        }
      }
    } catch (err) {
      console.error('Gmail sync failed', err);
    } finally {
      setIsSyncingGmail(false);
    }
  }, [settings.isGmailConnected, isSyncingGmail, settingsRef, saveJobApplication, updateJobStatus]);

  // Job action handlers for assistant view
  const jobActions = {
    saveJobApplication,
    deleteJobApplication,
    updateJobStatus,
    listJobs,
    findJobByCompany,
    applicationsRef
  };

  // Show OAuth callback handler if processing OAuth
  if (isOAuthCallback) {
    return <OAuthCallback onSuccess={handleOAuthSuccess} onError={handleOAuthError} />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

        {/* Tab Content */}
        {activeTab === AppTab.ASSISTANT && (
          <AssistantView settingsRef={settingsRef} jobActions={jobActions} />
        )}

        {activeTab === AppTab.DASHBOARD && (
          <JobDashboard
            applications={applications}
            onDelete={deleteJobApplication}
            onSave={saveJobApplication}
            isGmailConnected={settings.isGmailConnected}
            onSyncGmail={handleSyncGmail}
            isSyncing={isSyncingGmail}
          />
        )}

        {activeTab === AppTab.RESUME && <ResumeValidator settings={settings} />}

        {activeTab === AppTab.SETTINGS && (
          <SettingsView
            settings={settings}
            onUpdate={updateSettings}
            onClearData={clearAllJobs}
          />
        )}
      </main>
    </div>
  );
}

export default App;