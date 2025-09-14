import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ScrollView,
  Button
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '@/components/Header';

export default function MainDash() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDateStartPicker, setShowStartDatePicker] = useState(false);
  const [endDateObj, setEndDateObj] = useState(new Date());
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const onChangeStartDate = (event: any, selectedStartDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedStartDate) {
      setStartDate(selectedStartDate.toISOString().split('T')[0]);
      setDate(selectedStartDate);
    }
  };

  const onChangeEndDate = (event: any, selectedEndDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedEndDate) {
      setEndDate(selectedEndDate.toISOString().split('T')[0]);
      setEndDateObj(selectedEndDate);
    }
  };

  const handleCreateBudget = () => {
    Alert.alert('Budget Created', `Name: ${budgetName}\nTotal: ${budgetTotal}\nStart: ${startDate}\nEnd: ${endDate}`);
    setModalVisible(false);
  };

  const handleJoinBudget = () => {
    Alert.alert('Joining Budget', `Code: ${joinCode}`);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>

      <CustomHeader title="Budget Title" showBackButton={false}/>

      <Text style={styles.dashboardText}>Dashboard</Text>


      <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.createButtonText}>+ Create or Join new Budget</Text>
      </TouchableOpacity>

      <Text style={styles.budgetsLabel}>Budgets</Text>
      <Button title={'Go to budgets'} onPress={() => router.push('/(tabs)/dash')}></Button>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
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
              />

              <Text style={styles.label}>Start Date</Text>
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeStartDate}
              />

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
    padding: 16,
    flexGrow: 1
  },
  header: {
    padding: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    top: 15
  },
  dashboardText: {
    fontSize: 22,
    color: 'white',
    marginBottom: 10
  },
  createButton: {
    backgroundColor: '#ff4081',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  budgetsLabel: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10
  },
  budgetItem: {
    backgroundColor: '#003847',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderColor: 'white',
    borderWidth: 1
  },
  budgetItemText: {
    color: 'white'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#002933',
    padding: 20,
    borderRadius: 10
  },
  title: {
    fontSize: 22,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20
  },
  formSection: {
    marginBottom: 20
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginTop: 10
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginTop: 5
  },
  button: {
    backgroundColor: '#ff4081',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15
  },
  separator: {
    flex: 1,
    height: 1,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  orText: {
    marginHorizontal: 10,
    color: 'white'
  }
});
