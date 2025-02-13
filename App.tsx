import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import BottomSheet, {IBottomSheetRed} from './src/BottomSheet';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };
  const bottomSheetRef = React.useRef<IBottomSheetRed>(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View style={style.button}>
          <TouchableOpacity
            style={{backgroundColor: 'blue', borderRadius: 20, padding: 20}}
            onPress={() => bottomSheetRef.current?.expand()}>
            <Text style={{color: 'white'}}>Expand</Text>
          </TouchableOpacity>
        </View>
        <BottomSheet ref={bottomSheetRef} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const style = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
});

export default App;
