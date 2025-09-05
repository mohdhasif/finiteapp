// Example usage of DraggableBottomSheet component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DraggableBottomSheet from './DraggableBottomSheet';

const ExampleScreen = () => {
    return (
        <View style={styles.container}>
            {/* Your main content here */}
            <Text>Main Content</Text>
            
            {/* Draggable Bottom Sheet */}
            <DraggableBottomSheet
                snapPoints={[0, 200, 400]} // Custom snap points
                initialSnapIndex={1} // Start at middle position
                onSnapChange={(index) => console.log('Snapped to:', index)}
                backgroundColor="#FFFFFF"
                borderRadius={20}
                handleColor="#666"
                enablePanDownToClose={true}
                onClose={() => console.log('Bottom sheet closed')}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>Bottom Sheet Content</Text>
                    <Text>This is the content inside the draggable bottom sheet.</Text>
                </View>
            </DraggableBottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});

export default ExampleScreen;
