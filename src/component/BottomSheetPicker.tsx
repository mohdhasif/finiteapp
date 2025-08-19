// src/components/BottomSheetPicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Modal from 'react-native-modal';

type Item = { label: string; value: string };
type Props = {
    title?: string;
    visible: boolean;
    items: Item[];
    value: string | null;
    onClose: () => void;
    onSelect: (val: string) => void;
};

const BLUE = '#0B7EBE';

const BottomSheetPicker: React.FC<Props> = ({ title, visible, items, value, onClose, onSelect }) => {
    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            style={styles.modal}
            useNativeDriver
        >
            <View style={styles.sheet}>
                {!!title && <Text style={styles.title}>{title}</Text>}
                {/* <FlatList
                    data={items}
                    keyExtractor={(it) => it.value}
                    renderItem={({ item }) => {
                        const selected = value === item.value;
                        return (
                            <TouchableOpacity
                                style={[styles.row, selected && styles.rowSelected]}
                                onPress={() => { onSelect(item.value); onClose(); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
                                {selected && <Text style={styles.tick}>✓</Text>}
                            </TouchableOpacity>
                        );
                    }}
                    ItemSeparatorComponent={() => <View style={styles.sep} />}
                /> */}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: { justifyContent: 'flex-end', margin: 0 },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 14,
        paddingBottom: 24,
        paddingHorizontal: 16,
        maxHeight: '70%',
    },
    title: { textAlign: 'center', fontWeight: '700', fontSize: 16, marginBottom: 8, color: '#1B2430' },
    row: { paddingVertical: 14, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowSelected: { backgroundColor: '#F0F7FF', borderRadius: 10 },
    label: { fontSize: 16, color: '#1F2D3D' },
    labelSelected: { color: BLUE, fontWeight: '700' },
    tick: { fontSize: 18, color: BLUE },
    sep: { height: 1, backgroundColor: '#E8EEF4' },
});

export default BottomSheetPicker;
