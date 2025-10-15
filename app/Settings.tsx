import BackButton from '@/components/resuables/BackButton'
import React from 'react'
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Settings = () => {
  return (
    <SafeAreaView>
      <BackButton screenName='Settings'/>
      <Text>Settings</Text>
    </SafeAreaView>
  )
}

export default Settings