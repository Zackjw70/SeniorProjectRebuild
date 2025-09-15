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
        
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.expenseModal}>
              <Text style={styles.modalTitle}>Add Expense</Text>

              <TextInput
                placeholder="Item Name"
                value={itemName}
                onChangeText={setItemName}
                style={styles.amountInput}
              />
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
                <Picker.Item label="Select category..." value="" />
                {categories.map((choice) => (
                  <Picker.Item
                    key={choice.categoryId}
                    label={choice.categoryName}
                    value={choice.categoryName}
                  />
                ))}
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
                <Picker.Item label="Select user..." value="" />
                {usersWithAccess.map((entry) => (
                  <Picker.Item
                    key={entry.userId}
                    label={entry.usertable?.username || 'Unnamed'}
                    value={entry.usertable?.username || 'Unnamed'}
                  />
                ))}
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


