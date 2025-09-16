import React, { useEffect, useState, useMemo } from 'react';
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
  ScrollView,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/BudgetHeader';
import { supabase } from '@/database/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budgetcontext';
import { Picker } from '@react-native-picker/picker';

type Category = {
  categoryId: number;
  categoryName: string;
  iconId?: {
    Iconurl: string;
  };
};

type UserAccess = {
  userId: number;
  usertable?: {
    username: string;
  };
};

export const screenOptions = {
  headerShown: false,
};

export default function DashScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [user, setUser] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usersWithAccess, setUsersWithAccess] = useState<UserAccess[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);

  const { budgetId: rawBudgetId } = useLocalSearchParams();
  const parsedBudgetId = parseInt(rawBudgetId as string, 10);

  const { budgetId, setBudgetId, toggleRefresh, refreshFlag } = useBudget();

  useEffect(() => {
    if (!Number.isNaN(parsedBudgetId)) {
      setBudgetId(parsedBudgetId);
    }
  }, [parsedBudgetId]);

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // 🔹 Fetch items
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('itemlog')
      .select('*')
      .eq('budgetId', budgetId)
      .order('created_at', { ascending: false });

    if (!error && data) setItems(data);
  };

  // 🔹 Fetch categories with icons
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categorytable')
      .select(`
        categoryId,
        categoryName,
        iconId (
          Iconurl
        )
      `);

    if (!error && data) {
      setCategories(data);
    } else {
      console.error('Error fetching categories:', error);
    }
  };

  // 🔹 Fetch users
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('userconnection')
      .select(`
        userId,
        usertable (
          username
        )
      `)
      .eq('budgetId', budgetId);

    if (error) {
      console.error('Error fetching users:', error);
      setUsersWithAccess([]);
      return;
    }

    setUsersWithAccess(data || []);
  };

  // 🔹 Fetch total budget from budgetoverview
  const fetchBudget = async () => {
  const { data, error } = await supabase
    .from('budgetoverview')
    .select('totalbudget')
    .eq('budgetId', budgetId)
    .single();

  if (!error && data) {
    setTotalBudget(data.totalbudget);
  } else {
    console.error('Error fetching budget:', error);
  }
};


  useEffect(() => {
    if (budgetId > 0) {
      fetchItems();
      fetchCategories();
      fetchUsers();
      fetchBudget();
    }
  }, [budgetId, refreshFlag]);

  // 🔹 Save expense
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
        itemName: itemName.trim() || 'Unnamed Item',
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
      toggleRefresh();
      fetchItems();
      setModalVisible(false);

      setItemName('');
      setValue('');
      setCategory(null);
      setUser(null);
      setNotes('');
      setDate(new Date());
    }
  };

  // 🔹 Aggregate spending
  const { totalSpent, categoryBreakdown } = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    let spent = 0;

    items.forEach((item) => {
      spent += item.value;
      breakdown[item.categoryId] =
        (breakdown[item.categoryId] || 0) + item.value;
    });

    return { totalSpent: spent, categoryBreakdown: breakdown };
  }, [items]);

  const remaining = totalBudget - totalSpent;

  // 🔹 Simple color palette for categories
  const categoryColors = [
    '#ccd4ff',
    '#c2f0e0',
    '#ffd6cc',
    '#fff0b3',
    '#e0ccff',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#002B36' }}>
      <CustomHeader title={`Budget #${budgetId}`} />

      <ScrollView contentContainerStyle={styles.pageContainer}>
        {/* 🔹 Budget Summary */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>${totalBudget?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: remaining < 0 ? '#ff4d4d' : '#4dff88' },
            ]}
          >
            ${remaining.toFixed(2)}
          </Text>
        </View>

        {/* 🔹 Category Breakdown */}
        <Text style={styles.sectionTitle}>Breakdown by Category</Text>
        {Object.entries(categoryBreakdown).map(([categoryId, amount], index) => {
          const category = categories.find((c) => c.categoryId == categoryId);
          const percent = totalBudget
            ? ((amount / totalBudget) * 100).toFixed(0)
            : '0';

          return (
            <View
              key={categoryId}
              style={[
                styles.categoryRow,
                { backgroundColor: categoryColors[index % categoryColors.length] },
              ]}
            >
              {/* Left side: Icon + Category name */}
              <View style={styles.categoryLeft}>
                {category?.iconId?.Iconurl ? (
                  <Image
                    source={{ uri: category.iconId.Iconurl }}
                    style={styles.categoryIcon}
                  />
                ) : (
                  <Ionicons
                    name="folder-outline"
                    size={20}
                    color="#2a2a7f"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.categoryName}>
                  {category ? category.categoryName : 'Unknown'}
                </Text>
              </View>

              {/* Right side: Amount + Percent */}
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
                <Text style={styles.categoryPercent}>{percent}%</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* 🔹 Expense Modal */}
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
                    value={choice.categoryId}
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
                    value={entry.userId}
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
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#ff4081',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryRow: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2a2a7f',
  },
  categoryIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
    resizeMode: 'contain',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2a2a7f',
    marginRight: 12,
  },
  categoryPercent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2a2a7f',
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
