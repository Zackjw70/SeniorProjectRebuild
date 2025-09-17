import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ScrollView, Button,
  Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '@/components/Header';
import { useAuth } from '@/context/authcontext';
import { supabase } from '@/database/lib/supabase';

import { useBudget } from '@/context/budgetcontext';

import { Ionicons } from '@expo/vector-icons';


export default function MainDash() {
  const router = useRouter();
  const { budgetId } = useLocalSearchParams();
  const { user } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());
  const [budgets, setBudgets] = useState<any[]>([]);
  const [enteredCode, setEnteredCode] = useState('');
  const [joinedBudgetId, setJoinedBudgetId] = useState<number | null>(null);
  const { setBudgetId, setRoomcode } = useBudget();

  useEffect(() => {
    const run = async () => {
      if (!user?.userid) {
        router.replace('/login');
        return;
      }

      console.log('Logged in as:', user.email);

      // Fetch budgets owned by the user
      const { data: profile } = await supabase
        .from('usertable')
        .select('userid')
        .eq('email', user.email.trim().toLowerCase())
        .maybeSingle();

      if (!profile?.userid) {
        console.warn('User profile not found for:', user.email);
        return;
      }

      const { data: connectedBudgets, error: connectionError } = await supabase
      .from('userconnection')
      .select('budgetoverview(budgetId, name, startDate, ownerId)')
      .eq('userId', profile.userid);

    if (connectionError) {
      console.error('Error fetching connected budgets:', connectionError);
      Alert.alert('Error', 'Could not load connected budgets');
      return;
    }

    type Budget = {
      budgetId: number;
      name: string;
      startDate: string;
      ownerId: number;
    };

    type ConnectionRow = {
      budgetoverview: Budget[];
    };

    const connectedBudgetsTyped = connectedBudgets as ConnectionRow[];

      const availableBudgets = connectedBudgetsTyped
        .flatMap(entry => entry.budgetoverview)
        .filter((b): b is Budget => b !== null && b.budgetId !== undefined);

      // If joinedBudgetId is set, fetch and append it
      if (typeof joinedBudgetId === 'number' && joinedBudgetId > 0) {
        const { data: joinedBudget } = await supabase
          .from('budgetoverview')
          .select('budgetId, name, startDate, ownerId')
          .eq('budgetId', joinedBudgetId)
          .maybeSingle();

        if (joinedBudget) {
        const exists = availableBudgets.some(b => b.budgetId === joinedBudget.budgetId);
          if (!exists) availableBudgets.push(joinedBudget);
        }

      }
      const uniqueBudgets = availableBudgets.filter(
        (b, i, arr) => arr.findIndex(x => x.budgetId === b.budgetId) === i
      );
      setBudgets(uniqueBudgets);
    };

    run();
  }, [user, joinedBudgetId]);


  const onChangeStartDate = (event: any, selectedStartDate?: Date) => {
    if (selectedStartDate) {
      setStartDate(selectedStartDate.toISOString().split('T')[0]);
      setDate(selectedStartDate);
    }
  };

  const onChangeEndDate = (event: any, selectedEndDate?: Date) => {
    if (selectedEndDate) {
      setEndDate(selectedEndDate.toISOString().split('T')[0]);
      setEndDateObj(selectedEndDate);
    }
  };

  const fetchBudgets = async () => {
    const { data: profile } = await supabase
      .from('usertable')
      .select('userid')
      .eq('email', user?.email?.trim().toLowerCase())
      .maybeSingle();

    if (!profile?.userid) return;

    const { data, error } = await supabase
      .from('userconnection')
      .select('budgetoverview(budgetId, name, startDate, ownerId)')
      .eq('userId', profile.userid);

    if (error) {
      Alert.alert('Error', 'Could not load budgets');
    } else {
      const newData = data.map(entry => entry.budgetoverview).filter(Boolean);
      setBudgets(newData || []);
    }
  };

  const generateRoomCode = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };


  const handleCreateBudget = async () => {
    if (!budgetName.trim() || !budgetTotal.trim()) {
      Alert.alert('Missing Info', 'Please enter a name and total.');
      return;
    }

    const roomcode = generateRoomCode();

    const { data: profile } = await supabase
      .from('usertable')
      .select('userid')
      .eq('email', user?.email?.trim().toLowerCase())
      .maybeSingle();

    if (!profile?.userid) {
      Alert.alert('Error', 'User profile not found.');
      return;
    }

    const { error: insertError, data: insertedBudget } = await supabase
      .from('budgetoverview')
      .insert([
        {
          name: budgetName.trim(),
          startDate: startDate || new Date().toISOString(),
          endDate: endDate || null,
          ownerId: profile.userid,
          roomcode,
        },
      ])
      .select()
      .single();

    if (insertError || !insertedBudget?.budgetId) {
      console.error('Insert failed:', insertError);
      Alert.alert('Error', 'Could not create budget.');
      return;
    }

    
    const { error: connectionError } = await supabase
      .from('userconnection')
      .insert([{ userId: profile.userid, budgetId: insertedBudget.budgetId }]);

    if (connectionError) {
      console.error('Connection failed:', connectionError);
      Alert.alert('Error', 'Could not link user to budget.');
      return;
    }

    Alert.alert('Budget Created', `Room Code: ${roomcode}`);
    fetchBudgets();
    setModalVisible(false);
    setBudgetName('');
    setBudgetTotal('');
    setStartDate('');
    setEndDate('');
  };


  const handleJoinBudget = async () => {
    const cleanedCode = joinCode.trim().toLowerCase();
    console.log('Joining room with code:', cleanedCode);


    const { data: budgetMatch, error: budgetError } = await supabase
      .from('budgetoverview')
      .select('budgetId')
      .eq('roomcode', cleanedCode)
      .maybeSingle();

      console.log('Supabase response:', { budgetMatch, budgetError });

    if (!budgetMatch?.budgetId) {
      Alert.alert('Invalid Room Code', 'No budget found for that code.');
      return;
    }

    const { data: existingConnection } = await supabase
      .from('userconnection')
      .select('connectionId')
      .eq('userId', user?.userid)
      .eq('budgetId', budgetMatch.budgetId)
      .maybeSingle();

    if (!existingConnection) {
      const { error: insertError } = await supabase
        .from('userconnection')
        .insert([{ userId: user?.userid, budgetId: budgetMatch.budgetId }]);

      if (insertError) {
        console.error('Connection failed:', insertError);
        Alert.alert('Error', 'Could not link you to this budget.');
        return;
      }
    }

    setBudgetId(budgetMatch.budgetId);
    setRoomcode(cleanedCode);
    setJoinedBudgetId(budgetMatch.budgetId);
    setJoinCode('');
    Alert.alert('Joined Room', `Access granted to budget ${budgetMatch.budgetId}`);
  };

  const handleBudgetPress = async (budget: any) => {
    if (!budget?.budgetId) {
      Alert.alert('Error', 'This budget is missing an ID.');
      return;
    }

    router.push({
      pathname: '/(tabs)/dash',
      params: { budgetId: budget.budgetId.toString() },
    });
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="App Title" showBackButton={false} />

      <Text style={styles.sectionTitle}>Dashboard</Text>
      <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.createButtonText}>+ Create or Join new Budget</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Budgets</Text>
      <ScrollView style={{ width: '100%' }}>
        {budgets.length === 0 ? (
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>
            No budgets yet. Create one!
          </Text>
        ) : (
          budgets.map((budget, index) => (
            <TouchableOpacity
              key={index}
              style={styles.budgetItem}
              onPress={() => handleBudgetPress(budget)}
            >
              <Ionicons name="add" size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.budgetItemText}>{budget.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>


      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>New Budget</Text>

            <View style={styles.formSection}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={budgetName}
                onChangeText={setBudgetName}
                placeholder="Untitled Budget"
                placeholderTextColor="#999"
              />

              
              <Text style={styles.label}>Total</Text>
              <TextInput
                style={styles.input}
                value={budgetTotal}
                onChangeText={setBudgetTotal}
                placeholder="$0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                blurOnSubmit={true}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <Text style={styles.label}>Start Date</Text>
              <DateTimePicker value={date} mode="date" display="default" onChange={onChangeStartDate} />

              <Text style={styles.label}>End Date</Text>
              <DateTimePicker
                value={endDateObj}
                mode="date"
                display="default"
                onChange={onChangeEndDate}
              />

              <TouchableOpacity style={styles.button} onPress={handleCreateBudget}>
                <Text style={styles.buttonText}>Create Budget</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separatorContainer}>
              <View style={styles.separator} />
              <Text style={styles.orText}>Or Join With A Code</Text>
              <View style={styles.separator} />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Join Code:</Text>
              <TextInput
                style={styles.input}
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="Enter Code"
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.button} onPress={handleJoinBudget}>
                <Text style={styles.buttonText}>Join Budget</Text>
              </TouchableOpacity>
            </View>

            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#002B36',
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#ff4081',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  budgetItemText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#002933',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 22,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#ff4081',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  separator: {
    flex: 1,
    height: 1,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  orText: {
    marginHorizontal: 10,
    color: 'white',
  },

});
