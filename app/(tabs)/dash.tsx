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
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/BudgetHeader';
import { supabase } from '@/database/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBudget } from '@/context/budgetcontext';
import { iconMap } from '@/src/utils/iconMap';
import { useAuth } from '@/context/authcontext';
import DropDownPicker from 'react-native-dropdown-picker';

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
  const { user } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usersWithAccess, setUsersWithAccess] = useState<UserAccess[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [budgetName, setBudgetName] = useState<string>('');
  const [ownerId, setOwnerId] = useState<number | null>(null);

  // dropdown state
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState<{ label: string; value: number }[]>([]);
  const [userItems, setUserItems] = useState<{ label: string; value: number }[]>([]);

  const { budgetId: rawBudgetId } = useLocalSearchParams();
  const parsedBudgetId = parseInt(rawBudgetId as string, 10);

  const { budgetId, setBudgetId, toggleRefresh, refreshFlag } = useBudget();
  const router = useRouter();

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
      setCategoryItems(data.map((c) => ({ label: c.categoryName, value: c.categoryId })));
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

    if (!error && data) {
      setUsersWithAccess(data);
      setUserItems(data.map((u) => ({ label: u.usertable?.username || 'Unnamed', value: u.userId })));
    }
  };

  const fetchBudget = async () => {
    const { data, error } = await supabase
      .from('budgetoverview')
      .select('totalbudget, name, ownerId')
      .eq('budgetId', budgetId)
      .single();

    if (!error && data) {
      setTotalBudget(data.totalbudget);
      setBudgetName(data.name || '');
      setOwnerId(data.ownerId);
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
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }
    if (!selectedUserId) {
      Alert.alert('Error', 'Please choose a user.');
      return;
    }

    const { error } = await supabase.from('itemlog').insert([
      {
        itemName: itemName.trim() || 'Unnamed Item',
        value: parseFloat(value),
        categoryId: category,
        userId: selectedUserId,
        notes,
        created_at: date.toISOString(),
        budgetId,
      },
    ]);

    if (error) {
      Alert.alert('Error', 'Failed to save expense.');
    } else {
      Alert.alert('Success', 'Expense saved!');
      toggleRefresh();
      fetchItems();
      setModalVisible(false);

      setItemName('');
      setValue('');
      setCategory(null);
      setSelectedUserId(null);
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
    2: '#1E88E5',
    3: '#00ACC1',
    4: '#FB8C00',
    5: '#FDD835',
    6: '#8E24AA',
    7: '#E53935',
    8: '#43A047',
    9: '#2E7D32',
    10: '#7CB342',
    11: '#6D4C41',
    12: '#AB47BC',
    13: '#D81B60',
    14: '#FF7043',
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
          <Text style={[styles.summaryValue, { color: '#ff4d4d' }]}>
            ${totalSpent.toFixed(2)}
          </Text>
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

        <BudgetBar
          categoryBreakdown={categoryBreakdown}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
          categoryColorMap={categoryColorMap}
        />

        <Text style={styles.sectionTitle}>Breakdown by Category</Text>
        {Object.entries(categoryBreakdown).map(([categoryId, amount]) => {
          const category = categories.find(
            (c) => c.categoryId == Number(categoryId)
          );
          const percent = totalBudget
            ? ((amount / totalBudget) * 100).toFixed(0)
            : '0';
          const color = categoryColorMap[Number(categoryId)] || '#ddd';

          return (
            <View
              key={categoryId}
              style={[styles.categoryRow, { backgroundColor: color }]}
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

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

       <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View style={styles.expenseModal}>
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
                  <DropDownPicker
                    open={categoryOpen}
                    value={category}
                    items={categoryItems}
                    setOpen={setCategoryOpen}
                    setValue={setCategory}
                    setItems={setCategoryItems}
                    placeholder="Select category..."
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={{ color: '#fff' }}   
                    placeholderStyle={{ color: '#ccc' }} 
                    zIndex={3000}
                    zIndexInverse={1000}
                  />

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
                  <DropDownPicker
                    open={userOpen}
                    value={selectedUserId}
                    items={userItems}
                    setOpen={setUserOpen}
                    setValue={setSelectedUserId}
                    setItems={setUserItems}
                    placeholder="Select user..."
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={{ color: '#fff' }}   
                    placeholderStyle={{ color: '#ccc' }} 
                    zIndex={2000}
                    zIndexInverse={2000}
                  />

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
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { padding: 16 },
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
  summaryLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  barContainer: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 12,
  },
  segment: { height: '100%' },
  categoryRow: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoryLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  categoryIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
    resizeMode: 'contain',
  },
  categoryRight: { flexDirection: 'row', alignItems: 'center' },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginRight: 12,
  },
  categoryPercent: { fontSize: 15, fontWeight: '600', color: '#fff' },

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
  label: { fontSize: 13, color: '#ccc', marginBottom: 4, marginTop: 8 },
  valueText: { fontSize: 15, color: '#fff' },
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
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: '#aaa', fontSize: 14 },

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
  },
  dropdown: {
    backgroundColor: '#004d5c',
    borderRadius: 8,
    borderWidth: 0,
    minHeight: 40,
    marginBottom: 12,
  },
  dropdownContainer: {
    backgroundColor: '#004d5c',
    borderWidth: 0,
    borderRadius: 8,
  },
});
