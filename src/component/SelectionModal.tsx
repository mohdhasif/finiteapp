import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

type Item = { label: string; value: string | number; subLabel?: string };

type Props = {
    visible: boolean;
    title: string;
    items: Item[];
    value?: string | number | null;
    onClose: () => void;
    onSelect: (item: Item) => void;
    showSearch?: boolean;
    placeholder?: string;
};

const SelectionModal: React.FC<Props> = ({
    visible, title, items, value, onClose, onSelect,
    showSearch = true, placeholder = 'Search...'
}) => {
    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter(i =>
            i.label.toLowerCase().includes(s) ||
            (i.subLabel?.toLowerCase().includes(s) ?? false)
        );
    }, [q, items]);

    return (
        <Modal isVisible={visible} onBackdropPress={onClose} useNativeDriver>
            <View style={styles.card}>
                <Text style={styles.title}>{title}</Text>

                {showSearch && (
                    <TextInput
                        style={styles.search}
                        placeholder={placeholder}
                        placeholderTextColor="#8CA0B3"
                        value={q}
                        onChangeText={setQ}
                    />
                )}

                <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
                    {filtered.map((it) => {
                        const selected = value === it.value;
                        return (
                            <TouchableOpacity
                                key={`${it.value}`}
                                style={styles.row}
                                onPress={() => { onSelect(it); onClose(); }}
                                activeOpacity={0.9}
                            >
                                <View style={[styles.radio, selected && styles.radioOn]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>{it.label}</Text>
                                    {!!it.subLabel && <Text style={styles.sub}>{it.subLabel}</Text>}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {filtered.length === 0 && (
                        <Text style={styles.empty}>No options found.</Text>
                    )}
                </ScrollView>

                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={styles.closeTxt}>Close</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export default SelectionModal;

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 14 },
    title: { fontSize: 18, fontWeight: '700', color: '#1A2A35', marginBottom: 10 },
    search: {
        borderWidth: 1, borderColor: '#E1E6EC', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, backgroundColor: '#F3F6FA', color: '#1A2A35'
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F3F7', gap: 12
    },
    radio: {
        width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#A9B5C4'
    },
    radioOn: { borderColor: '#0B7EBE', backgroundColor: '#0B7EBE' },
    label: { fontSize: 16, color: '#1A2A35', fontWeight: '600' },
    sub: { fontSize: 13, color: '#6B7C8F', marginTop: 2 },
    empty: { color: '#6B7C8F', paddingVertical: 18, textAlign: 'center' },
    closeBtn: {
        marginTop: 12, alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 10, backgroundColor: '#0B7EBE'
    },
    closeTxt: { color: '#fff', fontWeight: '700' },
});
