import { View } from '@tarojs/components'
import { Tab } from '@/types'
import { Icon } from '@/components/Icon'
import { Archive, ChartColumn } from 'lucide'

interface Props {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

const Navigation: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'calendar' as Tab, icon: Archive },
    { id: 'progress' as Tab, icon: ChartColumn },
  ]

  return (
    <View className="bg-white/95 rounded-3xl shadow-lg border border-gray-100 h-14 flex items-center justify-between px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <View
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center transition-all ${
              isActive ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <Icon icon={tab.icon} size={24} color={isActive ? '#3b82f6' : '#9ca3af'} />
          </View>
        )
      })}
    </View>
  )
}

export default Navigation
