import TopBar from '@/components/resuables/TopBar'
import React from 'react'
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const MyWallet = () => {
  return (
    <SafeAreaView>
        <TopBar />
      <Text>MyWallet</Text>
    </SafeAreaView>
  )
}

export default MyWallet