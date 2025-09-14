import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Button,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; 
import CustomHeader from '@/components/BudgetHeader';

export const screenOptions = {
  headerShown: false,
};

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('');
  const [user, setUser] = useState('Zack');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const saveExpense = () => {
    if (!value) {
      alert('Please enter an amount.');
      return;
    }

    const newExpense = {
      value: parseFloat(value),
      category,
      user,
      notes,
      date: date.toISOString(),
    };

    console.log('Saving Expense:', newExpense);
    setModalVisible(false);
    setValue('');
    setCategory('');
    setNotes('');
    setDate(new Date());
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#002B36' }}>
      <CustomHeader title="Budget Title" />
      <View style={styles.pageContainer}>
        
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.overlay}>
            <View style={styles.expenseModal}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <Text style={styles.amountText}>${value || '0.00'}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity onPress={() => alert('Choose category')}>
                  <Text style={styles.valueText}>{category || 'Choose >'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>User</Text>
                <TouchableOpacity onPress={() => alert('Choose user')}>
                  <Text style={styles.valueText}>{user} {'>'}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Notes"
                placeholderTextColor="#888"
                value={notes}
                onChangeText={setNotes}
                style={styles.notesInput}
              />

              <TextInput
                placeholder="Enter Amount"
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                style={styles.hiddenInput}
              />

              <TouchableOpacity style={styles.addButton} onPress={saveExpense}>
                <Text style={styles.buttonText}>Add Expense</Text>
              </TouchableOpacity>

              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#002B36',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseModal: {
    width: '90%',
    backgroundColor: '#002933',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  amountText: {
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    color: 'white',
  },
  valueText: {
    fontSize: 16,
    color: '#ccc',
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    color: 'black',
  },
  hiddenInput: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  addButton: {
    backgroundColor: '#ff4081',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#ff4081',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
