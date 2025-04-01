import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';
import { monitorResearchProgress } from '../utils/researchService';

/**
 * Component that monitors research progress in the background
 * and marks it as complete when needed
 */
interface ResearchProgressMonitorProps {
  researchId: string;
  userId: string;
  onComplete?: () => void;
}

const ResearchProgressMonitor: React.FC<ResearchProgressMonitorProps> = ({ 
  researchId, 
  userId,
  onComplete 
}) => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  // Set up monitoring interval
  useEffect(() => {
    if (!researchId || !userId) return;
    
    // Initial check
    monitorResearchProgress(researchId, userId)
      .then(() => {
        // Check if research is already complete to avoid unnecessary monitoring
        return supabase
          .from('research_progress_new')
          .select('topic')
          .eq('research_id', researchId)
          .ilike('topic', '%research_done%')
          .limit(1);
      })
      .then(({ data }) => {
        if (data && data.length > 0) {
          console.log('Research already marked as complete, stopping monitoring');
          setIsMonitoring(false);
          if (onComplete) onComplete();
        }
      })
      .catch(error => {
        console.error('Error in initial research monitoring:', error);
      });
    
    // Set up interval for regular checks
    const intervalId = setInterval(() => {
      if (!isMonitoring) return;
      
      monitorResearchProgress(researchId, userId)
        .then(() => {
          // Check if research is now complete
          return supabase
            .from('research_progress_new')
            .select('topic')
            .eq('research_id', researchId)
            .ilike('topic', '%research_done%')
            .limit(1);
        })
        .then(({ data }) => {
          if (data && data.length > 0) {
            console.log('Research marked as complete, stopping monitoring');
            setIsMonitoring(false);
            if (onComplete) onComplete();
          }
        })
        .catch(error => {
          console.error('Error in research monitoring interval:', error);
        });
    }, 30000); // Check every 30 seconds
    
    // Set up Supabase subscription for real-time updates
    const subscription = supabase
      .channel('progress-monitor')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'research_progress_new',
        filter: `research_id=eq.${researchId}`
      }, payload => {
        // When a new topic is added, check if we should mark as complete
        monitorResearchProgress(researchId, userId)
          .catch(error => {
            console.error('Error in subscription research monitoring:', error);
          });
      })
      .subscribe();
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(subscription);
    };
  }, [researchId, userId, isMonitoring]);
  
  // This is an invisible component - it doesn't render anything
  return null;
};

export default ResearchProgressMonitor; 