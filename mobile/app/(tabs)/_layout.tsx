import { Tabs } from "expo-router";
import { Home, Search, Sparkles, User, Bell, Users } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#525252",
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 30,
        },
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="library" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}
