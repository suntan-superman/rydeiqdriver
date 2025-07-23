import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc, addDoc, updateDoc, deleteDoc, limit } from 'firebase/firestore';

function getTimeRangeFilter(timeRange = '30d') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

class CommunityService {
  async getCommunityDashboard(userId = null, timeRange = '30d') {
    // Driver forums
    const forums = await this.getDriverForums(timeRange);
    // Peer support
    const peerSupport = await this.getPeerSupport(userId, timeRange);
    // Community events
    const events = await this.getCommunityEvents(timeRange);
    // Driver groups
    const groups = await this.getDriverGroups(userId);
    // Mentorship programs
    const mentorship = await this.getMentorshipPrograms(userId);
    // Social networking
    const social = await this.getSocialNetworking(userId, timeRange);
    // Community analytics
    const analytics = await this.getCommunityAnalytics(timeRange);
    // Recommendations
    const recommendations = await this.getCommunityRecommendations(userId);
    
    return {
      forums,
      peerSupport,
      events,
      groups,
      mentorship,
      social,
      analytics,
      recommendations,
      timestamp: Date.now()
    };
  }

  async getDriverForums(timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const forumsRef = collection(db, 'driverForums');
    const forumsQuery = query(
      forumsRef,
      where('createdAt', '>=', timeFilter),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const forumsSnapshot = await getDocs(forumsQuery);
    const forums = forumsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      topics: forums,
      totalTopics: forums.length,
      categories: ['General', 'Tips & Tricks', 'Safety', 'Earnings', 'Vehicle Maintenance']
    };
  }

  async getPeerSupport(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const supportRef = collection(db, 'peerSupport');
    let supportQuery;
    
    if (userId) {
      supportQuery = query(
        supportRef,
        where('userId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      supportQuery = query(
        supportRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
    }
    
    const supportSnapshot = await getDocs(supportQuery);
    const support = supportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      requests: support,
      totalRequests: support.length,
      supportTypes: ['Technical', 'Emotional', 'Financial', 'Legal', 'Health']
    };
  }

  async getCommunityEvents(timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const eventsRef = collection(db, 'communityEvents');
    const eventsQuery = query(
      eventsRef,
      where('date', '>=', timeFilter),
      orderBy('date', 'asc'),
      limit(5)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      upcoming: events,
      totalEvents: events.length,
      eventTypes: ['Meetup', 'Training', 'Social', 'Workshop', 'Conference']
    };
  }

  async getDriverGroups(userId) {
    const groupsRef = collection(db, 'driverGroups');
    let groupsQuery;
    
    if (userId) {
      groupsQuery = query(
        groupsRef,
        where('members', 'array-contains', userId)
      );
    } else {
      groupsQuery = query(groupsRef, limit(10));
    }
    
    const groupsSnapshot = await getDocs(groupsQuery);
    const groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      userGroups: groups,
      totalGroups: groups.length,
      groupTypes: ['Regional', 'Vehicle Type', 'Experience Level', 'Interest-based']
    };
  }

  async getMentorshipPrograms(userId) {
    const mentorshipRef = collection(db, 'mentorshipPrograms');
    let mentorshipQuery;
    
    if (userId) {
      mentorshipQuery = query(
        mentorshipRef,
        where('participants', 'array-contains', userId)
      );
    } else {
      mentorshipQuery = query(mentorshipRef, limit(5));
    }
    
    const mentorshipSnapshot = await getDocs(mentorshipQuery);
    const programs = mentorshipSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      programs,
      totalPrograms: programs.length,
      programTypes: ['New Driver', 'Advanced Skills', 'Business Development', 'Safety']
    };
  }

  async getSocialNetworking(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const socialRef = collection(db, 'driverSocial');
    let socialQuery;
    
    if (userId) {
      socialQuery = query(
        socialRef,
        where('userId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      socialQuery = query(
        socialRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    }
    
    const socialSnapshot = await getDocs(socialQuery);
    const posts = socialSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      posts,
      totalPosts: posts.length,
      connections: 45, // Mock data
      followers: 23 // Mock data
    };
  }

  async getCommunityAnalytics(timeRange) {
    // Mock analytics data
    return {
      activeMembers: 1250,
      totalDiscussions: 456,
      eventsThisMonth: 8,
      mentorshipMatches: 89,
      averageResponseTime: '2.3 hours',
      communityGrowth: '+12%'
    };
  }

  async getCommunityRecommendations(userId) {
    // Mock recommendations based on user activity
    return {
      suggestedGroups: [
        { name: 'Electric Vehicle Drivers', members: 234, type: 'Vehicle Type' },
        { name: 'Night Shift Warriors', members: 156, type: 'Schedule' },
        { name: 'Premium Service Experts', members: 89, type: 'Service Level' }
      ],
      suggestedEvents: [
        { name: 'Safety Workshop', date: '2024-02-15', type: 'Training' },
        { name: 'Driver Meetup', date: '2024-02-20', type: 'Social' }
      ],
      suggestedMentors: [
        { name: 'Sarah Johnson', experience: '5 years', specialty: 'Safety' },
        { name: 'Mike Chen', experience: '8 years', specialty: 'Earnings' }
      ]
    };
  }

  // Additional methods for community interactions
  async createForumPost(postData) {
    const forumsRef = collection(db, 'driverForums');
    return await addDoc(forumsRef, {
      ...postData,
      createdAt: new Date(),
      likes: 0,
      replies: 0
    });
  }

  async joinGroup(groupId, userId) {
    const groupRef = doc(db, 'driverGroups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (groupDoc.exists()) {
      const currentMembers = groupDoc.data().members || [];
      if (!currentMembers.includes(userId)) {
        await updateDoc(groupRef, {
          members: [...currentMembers, userId]
        });
      }
    }
  }

  async createSupportRequest(requestData) {
    const supportRef = collection(db, 'peerSupport');
    return await addDoc(supportRef, {
      ...requestData,
      createdAt: new Date(),
      status: 'open',
      responses: 0
    });
  }
}

export const communityService = new CommunityService();
export default communityService; 