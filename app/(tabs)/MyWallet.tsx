import TopBar from '@/components/resuables/TopBar'
import React from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


const MyWallet = () => {
  return (
    <SafeAreaView>
        <TopBar />
      <View>
        <ImageBackground 
        source={require("../../assets/images/icons/money.png")} // Replace with your image source
        style={styles.imageBackground}
        imageStyle={styles.imageStyle} // Optional: for styling the image itself
      >
      </ImageBackground>
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
    imageStyle: {
        width: 256,
        height: 256,
        alignSelf: 'center',

    },
    imageBackground: {
        width: 300,
        height: 300,
    },
    overlayText: {
        color: 'white',
        fontSize: 24,
    }

  })

export default MyWallet