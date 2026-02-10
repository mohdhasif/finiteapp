import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { ProjectSummary } from '../services/projectService';
import { BASE_URL } from '../constants/apiConfig';

type Props = { data: ProjectSummary; onPress?: () => void; width?: number };
const BG = '#0A6FA7', WHITE = '#fff', WHITE70 = 'rgba(255,255,255,0.7)', TRACK = 'rgba(255,255,255,0.35)';

const ProjectCard: React.FC<Props> = ({ data, onPress, width = 220 }) => {
  const total = data.total_tasks ?? 0;
  const completed = data.completed_tasks ?? 0;
  const percent = typeof data.progress_percent === 'number'
    ? Math.max(0, Math.min(100, data.progress_percent))
    : (total > 0 ? Math.round((completed / total) * 100) : 0);

  const due = data.due_date
    ? new Date(data.due_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : 'No due date';

  const getAvatarSource = (avatarUrl: string | null) => {
    if (!avatarUrl) {
      return require('../assets/user.png');
    }
    // Construct full URL if it's a relative path
    const fullUrl = avatarUrl.startsWith('http') ? avatarUrl : `${BASE_URL}${avatarUrl}`;
    return { uri: fullUrl };
  };

  return (
    <TouchableOpacity style={[styles.card, { width }]} activeOpacity={0.9} onPress={onPress}>
      {/* Title and Client Section - Fixed Height */}
      <View style={styles.headerSection}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {data.project_title}
        </Text>
        <Text style={styles.client} numberOfLines={1} ellipsizeMode="tail">
          {data.client_name || 'No client assigned'}
        </Text>
      </View>

      {/* Date and Tasks Section - Fixed Height */}
      <View style={styles.infoSection}>
        <View style={styles.row}>
          <Ionicons name="calendar-clear-outline" size={16} color={WHITE} />
          <Text style={styles.rowText} numberOfLines={1} ellipsizeMode="tail">{due}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="checkmark-done-circle-outline" size={16} color={WHITE} />
          <Text style={styles.rowText} numberOfLines={1} ellipsizeMode="tail">{total} Tasks</Text>
        </View>
      </View>

      {/* Freelancers Section - Fixed Height */}
      <View style={styles.freelancersSection}>
        {data.freelancer_avatars && data.freelancer_avatars.length > 0 ? (
          data.freelancer_avatars.slice(0, 3).map((avatarUrl: string, index: number) => (
            <Image
              key={index}
              source={getAvatarSource(avatarUrl)}
              style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}
              resizeMode="cover"
            />
          ))
        ) : (
          <Text style={styles.noFreelancersText} numberOfLines={1} ellipsizeMode="tail">
            No freelancers assigned
          </Text>
        )}
      </View>

      {/* Progress Section - Fixed Position */}
      <Text style={styles.bigPercent}>{percent}%</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG,
    borderRadius: 22,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    overflow: 'hidden',
    height: 200, // Fixed height for consistency
  },
  headerSection: {
    height: 50, // Fixed height for title and client
    justifyContent: 'center',
  },
  title: { 
    color: WHITE, 
    fontSize: 18, 
    fontWeight: '800', 
    lineHeight: 22,
    marginBottom: 2,
  },
  client: { 
    color: WHITE70, 
    fontSize: 14,
  },
  infoSection: {
    height: 50, // Fixed height for date and tasks
    justifyContent: 'space-between',
    marginTop: 8,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center',
    height: 20,
  },
  rowText: { 
    color: WHITE, 
    fontSize: 14, 
    marginLeft: 6,
    flex: 1,
  },
  freelancersSection: {
    height: 30, // Fixed height for freelancers
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    borderWidth: 2, 
    borderColor: BG 
  },
  noFreelancersText: { 
    color: WHITE70, 
    fontSize: 12, 
    fontStyle: 'italic',
    flex: 1,
  },
  bigPercent: { 
    position: 'absolute', 
    right: 14, 
    bottom: 34, 
    color: WHITE, 
    fontSize: 18, 
    fontWeight: '800' 
  },
  progressTrack: { 
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    height: 8, 
    borderRadius: 8, 
    backgroundColor: TRACK,
  },
  progressFill: { 
    height: 8, 
    borderRadius: 8, 
    backgroundColor: WHITE 
  },
});

export default ProjectCard;
