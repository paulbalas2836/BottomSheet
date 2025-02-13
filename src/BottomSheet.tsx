import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SkeletonLoader from './SkeletonLeader';
import GeminiSvg from './GeminiSvg';
import ChevronDown from './ChevronDownSvg';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('screen');
const BotChat =
  'delay Function: The delay function takes the delay time in milliseconds (ms) as an argument.';
const BOTTOM_SHEET_HEIGHT = {
  min: 0,
  mid: SCREEN_HEIGHT * 0.6,
  max: SCREEN_HEIGHT,
};

/**
 * Type definition for the BottomSheet methods exposed to the parent component.
 */
export interface IBottomSheetRed {
  expand: () => void;
  expandFull: () => void;
  collapse: () => void;
}

/**
 * BottomSheet component that displays a draggable bottom sheet with a chat interface.
 * The bottom sheet can be expanded, collapsed, and dragged by the user.
 *
 * @param {object} ref - A ref to control the bottom sheet externally.
 * @returns {JSX.Element} The BottomSheet component.
 */
const BottomSheet = forwardRef<IBottomSheetRed>((_, ref) => {
  const [expanded, setExpanded] = useState(false);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const {current: opacity} = useRef(new Animated.Value(0));
  const {current: translateY} = useRef(
    new Animated.Value(SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.min),
  );
  const startPositionRef = useRef(0);
  const [shouldHideInput, setShouldHideInput] = useState(false);

  useImperativeHandle(ref, () => ({
    expand: open,
    expandFull: openFull,
    collapse: close,
  }));
  const insets = useSafeAreaInsets();

  /**
   * Animates the bottom sheet to a specified position with opacity changes.
   *
   * @param {number} toValue - The target Y position for the bottom sheet.
   * @param {function} [callback] - Optional callback to execute after the animation.
   */
  const animateTo = useCallback(
    (toValue: number, callback?: () => void) => {
      translateY.flattenOffset();
      const a1 = Animated.spring(translateY, {
        toValue,
        useNativeDriver: false,
        tension: 65,
        friction: 12,
      });

      const targetOpacity =
        toValue === SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.max
          ? 0.3
          : toValue === SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid
          ? 0.1
          : 0;

      const a2 = Animated.timing(opacity, {
        toValue: targetOpacity,
        duration: 150,
        useNativeDriver: false,
      });

      Animated.parallel([a1, a2]).start(callback);
    },
    [opacity, translateY],
  );

  /**
   * Opens the bottom sheet to a partially expanded state.
   */
  const open = useCallback(() => {
    setExpanded(true);
    setIsFullHeight(false);
    setShouldHideInput(false);
    animateTo(SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid);
  }, [animateTo]);

  /**
   * Opens the bottom sheet to the full expanded state.
   */
  const openFull = useCallback(() => {
    setExpanded(true);
    setIsFullHeight(true);
    setShouldHideInput(false);
    animateTo(SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.max + insets.top);
  }, [animateTo, insets.top]);

  /**
   * Closes the bottom sheet by collapsing it to the minimum height.
   */
  const close = useCallback(() => {
    Keyboard.dismiss();
    setShouldHideInput(true);
    animateTo(SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.min, () => {
      setExpanded(false);
      setIsFullHeight(false);
    });
  }, [animateTo]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      openFull();
    });
    return () => {
      showSubscription.remove();
    };
  }, [open, openFull]);

  /**
   * Determines the next position for the bottom sheet based on swipe velocity.
   *
   * @param {number} currentTranslateY - The current Y position of the bottom sheet.
   * @param {number} velocity - The velocity of the swipe.
   * @returns {number} The next Y position to animate to.
   */
  const getNextPosition = (currentTranslateY: number, velocity: number) => {
    if (Math.abs(velocity) > 1.5) {
      if (velocity < 0) {
        return currentTranslateY > SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid
          ? SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid
          : SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.max;
      } else {
        return currentTranslateY < SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid
          ? SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid
          : SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.min;
      }
    }

    const positions = [
      SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.max,
      SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid,
      SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.min,
    ];

    return positions.reduce((prev, curr) =>
      Math.abs(curr - currentTranslateY) < Math.abs(prev - currentTranslateY)
        ? curr
        : prev,
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startPositionRef.current = translateY._value;
          translateY.extractOffset();
        },
        onPanResponderMove: (_, {dy}) => {
          const newPosition = startPositionRef.current + dy;
          const clampedPosition = Math.max(
            SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.max,
            Math.min(SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.min, newPosition),
          );

          translateY.setValue(clampedPosition - startPositionRef.current);
          opacity.setValue(
            ((SCREEN_HEIGHT - clampedPosition - BOTTOM_SHEET_HEIGHT.min) /
              (BOTTOM_SHEET_HEIGHT.max - BOTTOM_SHEET_HEIGHT.min)) *
              0.3,
          );
        },
        onPanResponderRelease: (_, {vy}) => {
          Keyboard.dismiss();
          const currentPosition = translateY._value + startPositionRef.current;
          const nextPosition = getNextPosition(currentPosition, vy);

          if (nextPosition === SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.max) {
            openFull();
          } else if (nextPosition === SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT.mid) {
            open();
          } else {
            close();
          }
        },
      }),
    [translateY, opacity, openFull, open, close],
  );

  const [text, setText] = useState('');
  const isText = text.trim() !== '';
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<string[]>([]);

  /**
   * Handles submitting the user input and simulates a bot response.
   */
  const submitQuestion = async () => {
    const newChat = [...chat, text];
    setChat(newChat);
    setText('');

    setIsLoading(true);
    await new Promise<void>(resolve =>
      setTimeout(() => {
        newChat.push(BotChat);
        resolve();
      }, 3000),
    );

    setIsLoading(false);
  };

  const scrollViewRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated: true});
    }
  }, [chat, isLoading]);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Scrolls the chat view to the bottom.
   */
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  /**
   * Handles the visibility of the scroll-to-bottom button.
   *
   * @param {object} event - The scroll event.
   */
  const handleScroll = (event: any) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;

    const isBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - layoutMeasurement.height;
    setShowScrollButton(!isBottom);
  };

  /**
   * Animates the visibility of the scroll-to-bottom button.
   */
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showScrollButton ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, showScrollButton]);

  const [inputHeight, setInputHeight] = useState(0);

  /**
   * Calculates the height of the input field when its layout changes.
   *
   * @param {LayoutChangeEvent} event - The layout change event.
   */
  const getInputSize = (event: LayoutChangeEvent) => {
    const {height} = event.nativeEvent.layout;
    setInputHeight(height);
  };

  const disableButton = !isText || isLoading;
  const arrowColor = disableButton ? 'gray' : 'blue';
  const bottomSheetHeight = isFullHeight
    ? '100%'
    : BOTTOM_SHEET_HEIGHT.mid - inputHeight;

  const fullWidth = SCREEN_WIDTH - 32;
  return (
    <>
      <StatusBar translucent backgroundColor="transparent" />
      {expanded && (
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View style={[styles.overlay, {opacity}]} />
        </TouchableWithoutFeedback>
      )}
      <Animated.View style={[styles.bottomSheet, {transform: [{translateY}]}]}>
        <View style={styles.handleWrapper} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>
        <View style={[styles.bottomSheetContent, {height: bottomSheetHeight}]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <GeminiSvg />
              <Text style={styles.headerTitle}>Gemini</Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={true}
            style={[styles.container]}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            contentContainerStyle={styles.contentContainer}
            bounces={false}>
            {chat.map((el, index) => {
              const isUser = index % 2 === 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.cardView,
                    isUser ? styles.userCard : styles.botCard,
                  ]}>
                  <Text style={styles.text}>{el}</Text>
                </View>
              );
            })}
            {isLoading && (
              <View style={styles.loaderContainer}>
                <SkeletonLoader
                  width={fullWidth}
                  height={15}
                  borderRadius={8}
                />
                <SkeletonLoader
                  width={fullWidth}
                  height={15}
                  borderRadius={8}
                />
                <SkeletonLoader
                  width={fullWidth / 2}
                  height={15}
                  borderRadius={8}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.View>
      {!shouldHideInput && expanded && (
        <View style={styles.inputSection} onLayout={getInputSize}>
          <Animated.View
            style={[
              styles.scrollBottomContainer,
              {
                left: fullWidth / 2,
                opacity: fadeAnim,
                transform: [{scale: fadeAnim}],
              },
            ]}>
            <TouchableOpacity
              onPress={scrollToBottom}
              style={styles.scrollBottomButton}>
              <ChevronDown />
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter a prompt here"
              placeholderTextColor="#666"
              onChangeText={setText}
              value={text}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              disabled={disableButton}
              onPress={submitQuestion}>
              <View
                style={[styles.sendArrow, {borderBottomColor: arrowColor}]}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
});

export default BottomSheet;

const styles = StyleSheet.create({
  loaderContainer: {gap: 10},
  scrollBottomContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    top: -60,
  },
  scrollBottomButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    height: '100%',
    backgroundColor: 'white',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    padding: 12,
    borderRadius: 99,
  },
  container: {
    flex: 1,
    marginBottom: 80,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  bottomSheetContent: {
    paddingVertical: 20,
  },
  handleWrapper: {
    marginTop: -24,
    paddingVertical: 24,
  },
  cardView: {
    maxWidth: SCREEN_WIDTH * 0.75,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  botCard: {
    backgroundColor: 'gray',
    alignSelf: 'flex-start',
  },
  text: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  bottomSheet: {
    paddingTop: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    left: 0,
    position: 'absolute',
    width: SCREEN_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    height: '100%',
    shadowOpacity: 1,
    shadowRadius: 15.19,
    elevation: 20,
  },

  iconButton: {
    padding: 8,
    marginLeft: 16,
  },

  inputSection: {
    position: 'absolute',
    bottom: 0,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    width: '100%',
    backgroundColor: 'white',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{rotate: '90deg'}],
  },

  overlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 10,
    position: 'absolute',
    backgroundColor: '#000000',
  },

  handle: {
    height: 8,
    width: 100,
    borderRadius: 4,
    alignSelf: 'center',
    backgroundColor: 'gray',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geminiIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamond: {
    width: 20,
    height: 20,
    backgroundColor: '#4285f4',
    transform: [{rotate: '45deg'}],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
