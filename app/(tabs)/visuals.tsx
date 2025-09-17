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
import { iconMap } from '@/src/utils/iconMap';

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
  const [budgetName, setBudgetName] = useState<string>('');

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

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('itemlog')
      .select('*')
      .eq('budgetId', budgetId)
      .order('created_at', { ascending: false });

    if (!error && data) setItems(data);
  };


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


  const fetchBudget = async () => {
    const { data, error } = await supabase
      .from('budgetoverview')
      .select('totalbudget, name')
      .eq('budgetId', budgetId)
      .single();

    if (!error && data) {
      setTotalBudget(data.totalbudget);
      setBudgetName(data.name || '');
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

  const totalSpent = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  const remaining = totalBudget - totalSpent;


const categoryColorMap: { [key: number]: string } = {
  2: '#1E88E5', // strong blue
  3: '#00ACC1', // teal
  4: '#FB8C00', // orange
  5: '#FDD835', // golden yellow 
  6: '#8E24AA', // purple
  7: '#E53935', // red
  8: '#43A047', // green
  9: '#2E7D32', // dark green
  10: '#7CB342', // lime
  11: '#6D4C41', // brown
  12: '#AB47BC', // magenta
  13: '#D81B60', // hot pink
  14: '#FF7043', // coral
};

  return (
    <View style={{ flex: 1, backgroundColor: '#002B36' }}>
      <CustomHeader title={budgetName ? budgetName : `Budget #${budgetId}`} />

      <ScrollView contentContainerStyle={styles.pageContainer}>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            ${totalBudget?.toFixed(2) || '0.00'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={[styles.summaryValue, { color: "#ff4d4d" }]}>${totalSpent.toFixed(2)}</Text>
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

        <Text style={styles.sectionTitle}>Expenses</Text>
        {Object.entries(
          items.reduce((acc, item) => {
            const dateKey = new Date(item.created_at).toDateString();
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(item);
            return acc;
          }, {} as { [key: string]: any[] })
        ).map(([dateKey, dayItems]) => (
          <View key={dateKey}>

            <Text style={styles.dateHeader}>{dateKey}</Text>


            {dayItems.map((item, index) => {
              const categoryInfo = categories.find(
                (c) => c.categoryId === item.categoryId
              );

              const uniqueKey =
                item.id ??
                `${item.categoryId}-${item.itemName}-${item.created_at}-${index}`;

              return (
                <View
                  key={uniqueKey}
                  style={[
                    styles.categoryRow,
                    { backgroundColor: categoryColorMap[item.categoryId] || '#ddd' },
                  ]}
                >

                  <View style={styles.categoryLeft}>
                    {categoryInfo?.iconId?.Iconurl ? (
                      <Image
                        source={
                          iconMap[categoryInfo.iconId.Iconurl] ||
                          require('@/assets/icons/Question.png')
                        }
                        style={styles.categoryIcon}
                      />
                    ) : (
                      <Ionicons
                        name="folder-outline"
                        size={20}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <View>
                      <Text style={styles.categoryName}>{item.itemName}</Text>
                      <Text style={{ color: '#fff', fontSize: 13 }}>
                        {categoryInfo?.categoryName || 'Unknown'}
                      </Text>
                    </View>
                  </View>


                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      ${item.value.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
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
                placeholderTextColor="#888"
                style={styles.amountInput}
              />

              <TextInput
                placeholder="Item Name"
                value={itemName}
                onChangeText={setItemName}
                placeholderTextColor="#888"
                style={styles.textInput}
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
                    value={choice.categoryId}
                  />
                ))}
              </Picker>

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

              <TextInput
                placeholder="Notes"
                placeholderTextColor="#888"
                value={notes}
                onChangeText={setNotes}
                style={styles.textArea}
                multiline
              />

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
    color: '#fff',
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
    color: '#fff',
    marginRight: 12,
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
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
    marginBottom: 8,
  },
});
