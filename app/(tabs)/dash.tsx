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

// 🔹 Budget Bar Component
const BudgetBar = ({
  categoryBreakdown,
  totalBudget,
  totalSpent,
  categoryColorMap,
}: {
  categoryBreakdown: { [key: string]: number };
  totalBudget: number;
  totalSpent: number;
  categoryColorMap: { [key: number]: string };
}) => {
  const segments: { color: string; flex: number }[] = [];

  if (totalBudget <= 0) {
    return (
      <View style={styles.barContainer}>
        <View style={[styles.segment, { flex: 1, backgroundColor: '#fff' }]} />
      </View>
    );
  }

  let totalPercent = 0;
  Object.entries(categoryBreakdown).forEach(([categoryId, amount]) => {
    const percent = (amount / totalBudget) * 100;
    if (percent > 0) {
      segments.push({
        color: categoryColorMap[Number(categoryId)] || '#888',
        flex: percent,
      });
      totalPercent += percent;
    }
  });

  if (totalSpent <= totalBudget) {
    segments.push({ color: '#fff', flex: 100 - totalPercent });
  } else {
    const overspendRatio = 100 / totalPercent;
    segments.forEach((s) => (s.flex = s.flex * overspendRatio));
  }

  return (
    <View style={styles.barContainer}>
      {segments.map((s, idx) => (
        <View
          key={idx}
          style={[styles.segment, { flex: s.flex, backgroundColor: s.color }]}
        />
      ))}
    </View>
  );
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

const categoryColorMap: { [key: number]: string } = {
  2: '#4A90E2', // strong blue
  3: '#50E3C2', // teal
  4: '#F5A623', // orange
  5: '#F8E71C', // yellow (slightly darker for contrast)
  6: '#9013FE', // purple
  7: '#D0021B', // red
  8: '#7ED321', // green
  9: '#417505', // darker green
  10: '#B8E986', // lime
  11: '#8B572A', // brown
  12: '#BD10E0', // pink/purple
  13: '#F62E76', // hot pink
  14: '#FF6F61', // coral
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

        {/* 🔹 Budget Bar */}
        <BudgetBar
          categoryBreakdown={categoryBreakdown}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
          categoryColorMap={categoryColorMap}
        />

        <Text style={styles.sectionTitle}>Breakdown by Category</Text>
        {Object.entries(categoryBreakdown).map(([categoryId, amount]) => {
  const category = categories.find((c) => c.categoryId == Number(categoryId));
  const percent = totalBudget
    ? ((amount / totalBudget) * 100).toFixed(0)
    : '0';
  const color = categoryColorMap[Number(categoryId)] || '#ddd';

  return (
    <View
      key={categoryId}
      style={[styles.categoryRow, { backgroundColor: color }]} // 🔹 back to old style
    >
      <View style={styles.categoryLeft}>
        {category?.iconId?.Iconurl ? (
          <Image
            source={
              iconMap[category?.iconId?.Iconurl] ||
              require('@/assets/icons/Question.png')
            }
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

      <View style={styles.categoryRight}>
        <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
        <Text style={styles.categoryPercent}>{percent}%</Text>
      </View>
    </View>
  );
})}

      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Expense Modal */}
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
  // 🔹 Budget bar styles
  barContainer: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 12,
  },
  segment: {
    height: '100%',
  },
  colorBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 10,
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
categoryPercent: {
  fontSize: 15,
  fontWeight: '600',
  color: '#fff',
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
    borderRadius:10,
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
