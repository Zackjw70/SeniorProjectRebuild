import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/BudgetHeader';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/database/lib/supabase';
import { useBudget } from '@/context/budgetcontext';

type Category = {
  categoryId: number;
  categoryName: string;
};

type UserAccess = {
  userId: number;
  usertable: {
    username: string;
  };
};

export const screenOptions = {
  headerShown: false,
};

export default function TabTwoScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('food');
  const [user, setUser] = useState('Zack');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usersWithAccess, setUsersWithAccess] = useState<UserAccess[]>([]);

  const { budgetId, toggleRefresh, refreshFlag } = useBudget();

  useEffect(() => {
    if (budgetId > 0) {
      fetchCategories();
      fetchUsers();
    }
  }, [budgetId, refreshFlag]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categorytable')
      .select('categoryId, categoryName');

    if (!error) setCategories(data);
    else console.error('Error fetching categories:', error);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('userconnection')
      .select('userId, usertable(username)')
      .eq('budgetId', budgetId);

    if (!error) setUsersWithAccess(data);
    else console.error('Error fetching users:', error);
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const saveExpense = async () => {
    if (!value.trim() || isNaN(parseFloat(value))) {
      alert('Please enter a valid amount.');
      return;
    }

    const selectedCategory = categories.find(c => c.categoryName === category)?.categoryId;
    const selectedUser = usersWithAccess.find(u => u.usertable?.username === user)?.userId;

    if (!selectedCategory || !selectedUser) {
      alert('Invalid category or user selection.');
      return;
    }

    const { error } = await supabase.from('itemlog').insert([
      {
        itemName: itemName.trim() || 'Unnamed Item',
        value: parseFloat(value),
        categoryId: selectedCategory,
        userId: selectedUser,
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
      toggleRefresh();
      setModalVisible(false);
      setItemName('');
      setValue('');
      setCategory('food');
      setUser('Zack');
      setNotes('');
      setDate(new Date());
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#002B36' }}>
      <CustomHeader title="Budget Title" />
      <View style={styles.pageContainer}>
        
        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        {/* Modal */}
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlay}>
              <View style={styles.expenseModal}>
                <Text style={styles.modalTitle}>Add Expense</Text>

                {/* Amount */}
                <TextInput
                  placeholder="Enter Amount"
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                  style={styles.amountInput}
                />

                {/* Item Name */}
                <TextInput
                  placeholder="Item Name"
                  value={itemName}
                  onChangeText={setItemName}
                  placeholderTextColor="#888"
                  style={styles.textInput}
                />

                {/* Category Picker */}
                <Text style={styles.label}>Category</Text>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select category..." value="" />
                  {categories.map((choice) => (
                    <Picker.Item
                      key={choice.categoryId}
                      label={choice.categoryName}
                      value={choice.categoryName}
                    />
                  ))}
                </Picker>

                {/* Date */}
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateBox}
                  onPress={() => setShowDatePicker(true)}
                >
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

                {/* User Picker */}
                <Text style={styles.label}>User</Text>
                <Picker
                  selectedValue={user}
                  onValueChange={(itemValue) => setUser(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select user..." value="" />
                  {usersWithAccess.map((entry) => (
                    <Picker.Item
                      key={entry.userId}
                      label={entry.usertable?.username || 'Unnamed'}
                      value={entry.usertable?.username || 'Unnamed'}
                    />
                  ))}
                </Picker>

                {/* Notes */}
                <TextInput
                  placeholder="Notes"
                  placeholderTextColor="#888"
                  value={notes}
                  onChangeText={setNotes}
                  style={styles.textArea}
                  multiline
                />

                {/* Buttons */}
                <TouchableOpacity style={styles.addButton} onPress={saveExpense}>
                  <Text style={styles.buttonText}>Add Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseModal: {
    width: '85%',
    backgroundColor: '#003847',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  amountInput: {
    backgroundColor: '#004d5c',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#004d5c',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#004d5c',
    borderRadius: 10,
    padding: 10,
    height: 70,
    fontSize: 15,
    color: '#fff',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
    marginTop: 8,
  },
  valueText: {
    fontSize: 15,
    color: '#fff',
  },
  dateBox: {
    backgroundColor: '#004d5c',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  picker: {
    backgroundColor: '#004d5c',
    borderRadius: 10,
    color: '#fff',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#ff4081',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    color: '#aaa',
    fontSize: 14,
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
