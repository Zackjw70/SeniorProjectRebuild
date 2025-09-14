import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Button,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/BudgetHeader';
import { useAuth } from '@/context/authcontext';
import { supabase } from '@/database/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export const screenOptions = {
  headerShown: false,
};

export default function DashScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('food');
  const [user, setUser] = useState('Zack');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const { userId } = useAuth();
  const { budgetId: rawBudgetId } = useLocalSearchParams();
  const parsedBudgetId = parseInt(rawBudgetId as string, 10);
  const budgetId = Number.isNaN(parsedBudgetId) ? 0 : parsedBudgetId;

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('itemlog')
        .select('*')
        .eq('budgetId', budgetId);

      if (error) {
        console.error('Error fetching items:', error);
      } else {
        setItems(data);
      }
    };

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categorytable')
        .select('categoryId, categoryName');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data);
      }
    };

    fetchCategories();

    if (budgetId > 0) fetchItems();
  }, [budgetId]);

  const saveExpense = async () => {
    if (!value.trim() || isNaN(parseFloat(value))) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!category) {
      alert('Please select a category.');
      return;
    }
    if (!user) {
      alert('Please choose a user.');
      return;
    }

    const { error } = await supabase.from('itemlog').insert([
      {
        value: parseFloat(value),
        categoryId: category,
        userId: user,
        notes,
        created_at: date.toISOString(),
        budgetId,
      },
    ]);

    if (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense.');
    } else {
      alert('Expense saved!');
      setModalVisible(false);
      setValue('');
      setCategory('food');
      setUser('Zack');
      setNotes('');
      setDate(new Date());
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#002B36' }}>
      <CustomHeader title={`Budget #${budgetId}`} />
      <ScrollView contentContainerStyle={styles.pageContainer}>
        {items.map((item: any) => (
          <View key={item.itemId} style={styles.itemCard}>
            <Text style={styles.itemText}>{item.itemName || 'Unnamed Item'}</Text>
            <Text style={styles.itemText}>Amount: ${item.value}</Text>
            <Text style={styles.itemText}>Category ID: {item.categoryId}</Text>
            <Text style={styles.itemText}>User ID: {item.userId}</Text>
            <Text style={styles.itemText}>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.expenseModal}>
              <Text style={styles.modalTitle}>Add Expense</Text>

              <TextInput
                placeholder="Enter Amount"
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                style={styles.amountInput}
              />

              <Text style={styles.label}>Category</Text>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Food" value="food" />
                <Picker.Item label="Transport" value="transport" />
                <Picker.Item label="Entertainment" value="entertainment" />
                <Picker.Item label="Other" value="other" />
              </Picker>

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.valueText}>{date.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onChangeDate}
                />
              )}

              <Text style={styles.label}>User</Text>
              <Picker
                selectedValue={user}
                onValueChange={(itemValue) => setUser(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Zack" value="Zack" />
                <Picker.Item label="Andrew" value="Andrew" />
                <Picker.Item label="Corey" value="Corey" />
              </Picker>

              <TextInput
                placeholder="Notes"
                placeholderTextColor="#888"
                value={notes}
                onChangeText={setNotes}
                style={styles.notesInput}
              />

              <TouchableOpacity style={styles.addButton} onPress={saveExpense}>
                <Text style={styles.buttonText}>Add Expense</Text>
              </TouchableOpacity>

              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#003847',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemText: {
    color: 'white',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  amountInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: 'black',
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
  },
  valueText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    color: 'black',
  },
  addButton: {
    backgroundColor: '#ff4081',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
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
