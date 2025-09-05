import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Animated,
    PanResponder,
    Dimensions,
    StyleSheet,
    ViewStyle,
    Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DraggableBottomSheetProps {
    children: React.ReactNode;
    snapPoints?: number[];                // e.g. [0, 0.25H, 0.75H]
    initialSnapIndex?: number;            // default 1
    onSnapChange?: (index: number) => void;
    backgroundColor?: string;
    borderRadius?: number;
    handleColor?: string;                 // not used in this minimal patch
    style?: ViewStyle;
    enablePanDownToClose?: boolean;
    onClose?: () => void;
}

const DraggableBottomSheet: React.FC<DraggableBottomSheetProps> = ({
    children,
    snapPoints = [0, SCREEN_HEIGHT * 0.25, SCREEN_HEIGHT * 0.75],
    initialSnapIndex = 1,
    onSnapChange,
    backgroundColor = '#FFFFFF',
    borderRadius = 30,
    style,
    enablePanDownToClose = false,
    onClose,
}) => {
    // Animated value controls translateY directly
    const slideAnim = useRef(new Animated.Value(snapPoints[initialSnapIndex])).current;
    const lastPosition = useRef(snapPoints[initialSnapIndex]);
    const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnapIndex);
    const isDragging = useRef(false);

    // keep these helpers here to avoid recreating arrays
    const minY = snapPoints[0];
    const maxY = snapPoints[snapPoints.length - 1];

    // Keep value in sync on props change
    useEffect(() => {
        slideAnim.setValue(snapPoints[initialSnapIndex]);
        lastPosition.current = snapPoints[initialSnapIndex];
        setCurrentSnapIndex(initialSnapIndex);
    }, [initialSnapIndex, snapPoints, slideAnim]);

    // Utility: clamp number
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

    // Decide nearest snap point (velocity-aware)
    const getNearestSnapIndex = (projected: number) => {
        let nearest = 0;
        let best = Math.abs(projected - snapPoints[0]);
        for (let i = 1; i < snapPoints.length; i++) {
            const d = Math.abs(projected - snapPoints[i]);
            if (d < best) {
                best = d;
                nearest = i;
            }
        }
        return nearest;
    };

    const snapTo = useCallback((targetIndex: number) => {
        if (targetIndex < 0 || targetIndex >= snapPoints.length) return;
        const toValue = snapPoints[targetIndex];

        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: true,
            friction: 9,
            tension: 90,
        }).start(({ finished }) => {
            if (!finished) return;
            lastPosition.current = toValue;
            setCurrentSnapIndex(targetIndex);
            onSnapChange?.(targetIndex);
            if (enablePanDownToClose && onClose && targetIndex === snapPoints.length - 1 && toValue >= maxY) {
                onClose();
            }
        });
    }, [snapPoints, slideAnim, onSnapChange, enablePanDownToClose, onClose, maxY]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true, // handle area only
            onMoveShouldSetPanResponder: (_, g) => {
                const absDx = Math.abs(g.dx);
                const absDy = Math.abs(g.dy);
                return absDy > 4 && absDy > absDx; // vertical, small threshold
            },
            onPanResponderGrant: () => {
                isDragging.current = true;
                // Stop any running spring to avoid jump/glitch
                slideAnim.stopAnimation((val: number) => {
                    lastPosition.current = val;
                });
            },
            onPanResponderMove: (_, g) => {
                if (!isDragging.current) return;
                const y = clamp(lastPosition.current + g.dy, minY, maxY);
                // With native driver, setValue is fine for transforms
                slideAnim.setValue(y);
            },
            onPanResponderRelease: (_, g) => {
                isDragging.current = false;

                // Velocity factor: tune per platform (Android often needs larger)
                const velocityScale = Platform.OS === 'android' ? 140 : 120;
                const projected = clamp(lastPosition.current + g.dy + g.vy * velocityScale, minY, maxY);

                // Optional: quick-close if enabled & dragged down fast near bottom
                if (enablePanDownToClose && onClose) {
                    const nearBottom = lastPosition.current > (snapPoints[snapPoints.length - 1] - 24);
                    if (g.vy > 1.2 || (nearBottom && g.dy > 40)) {
                        onClose();
                        return;
                    }
                }

                const target = getNearestSnapIndex(projected);
                snapTo(target);
            },
            onPanResponderTerminate: () => {
                isDragging.current = false;
                // Return to nearest snap from current animated value
                slideAnim.stopAnimation((val: number) => {
                    const target = getNearestSnapIndex(val);
                    snapTo(target);
                });
            },
            onPanResponderReject: () => {
                isDragging.current = false;
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    backgroundColor,
                    borderTopLeftRadius: borderRadius,
                    borderTopRightRadius: borderRadius,
                },
                style,
            ]}
        >
            {/* Only the handle area captures the pan to avoid conflicts with content taps */}
            <View {...panResponder.panHandlers} style={styles.gestureArea} pointerEvents="box-only">
                <View style={styles.handle}>
                    <View style={styles.handleBar} />
                </View>
            </View>

            <View style={styles.content}>
                {children}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    gestureArea: {
        width: '100%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.01)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    handle: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    handleBar: {
        width: 60,
        height: 6,
        backgroundColor: '#bbb',
        borderRadius: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
});

export default DraggableBottomSheet;
